import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import {
  classifyInstructionFiles,
  type HostSession,
  resolveHostSession,
} from "./hosts.js";
import { PRESENT_TO_USER, bestPracticesFor, practiceContextFromScan } from "./report.js";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export type Ecosystem = PackageManager | "go" | "pip";

export type InstructionFileStatus = {
  path: string;
  exists: boolean;
  empty: boolean;
  bytes: number;
};

export type WorkspaceHint = {
  dir: string;
  ecosystem: Ecosystem;
  frameworks: string[];
  scripts: Record<string, string>;
};

export type ScanResult = {
  root: string;
  packageManager: PackageManager;
  languages: string[];
  frameworks: string[];
  scripts: Record<string, string>;
  layout: string[];
  instructionFiles: InstructionFileStatus[];
  nestedInstructions: InstructionFileStatus[];
  workspaces: WorkspaceHint[];
  hasMakefile: boolean;
  /** Phony / rule targets from root Makefile (shallow parse). */
  makefileTargets: string[];
  /** First useful line(s) from README.md, if any. */
  readmeBlurb: string | null;
  hasCi: boolean;
  notes: string[];
};

const INSTRUCTION_CANDIDATES = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  ".github/copilot-instructions.md",
  ".gemini/settings.json",
  ".cursor/rules",
  ".claude/rules",
  ".claude/skills",
  ".cursor/skills",
  ".devin/rules",
  ".windsurf/rules",
  ".clinerules",
] as const;

const EXT_LANG: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".kt": "Kotlin",
  ".swift": "Swift",
  ".rb": "Ruby",
  ".php": "PHP",
  ".cs": "C#",
};

function safeRead(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function parseJsonObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function detectNodePackageManager(dir: string): PackageManager | null {
  if (existsSync(join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(dir, "yarn.lock"))) return "yarn";
  if (existsSync(join(dir, "bun.lockb")) || existsSync(join(dir, "bun.lock")))
    return "bun";
  if (existsSync(join(dir, "package-lock.json"))) return "npm";
  if (existsSync(join(dir, "package.json"))) return "npm";
  return null;
}

function listTopDirs(root: string): string[] {
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "node_modules")
      .map((d) => d.name)
      .slice(0, 24);
  } catch {
    return [];
  }
}

function sampleLanguages(root: string): string[] {
  const counts = new Map<string, number>();
  const skip = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next"]);

  function walk(dir: string, depth: number): void {
    if (depth > 3) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name.startsWith(".") || skip.has(ent.name)) continue;
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      const lang = EXT_LANG[extname(ent.name)];
      if (lang) counts.set(lang, (counts.get(lang) ?? 0) + 1);
    }
  }

  walk(root, 0);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang]) => lang);
}

function frameworksFromPkg(pkg: Record<string, unknown> | null): string[] {
  if (!pkg) return [];
  const out: string[] = [];
  const deps = {
    ...(typeof pkg.dependencies === "object" && pkg.dependencies
      ? (pkg.dependencies as Record<string, string>)
      : {}),
    ...(typeof pkg.devDependencies === "object" && pkg.devDependencies
      ? (pkg.devDependencies as Record<string, string>)
      : {}),
  };
  if (deps.react || deps["react-dom"]) out.push("React");
  if (deps.next) out.push("Next.js");
  if (deps.vue) out.push("Vue");
  if (deps.express) out.push("Express");
  if (deps.vite) out.push("Vite");
  if (deps["@nestjs/core"]) out.push("NestJS");
  if (deps.prisma || deps["@prisma/client"]) out.push("Prisma");
  return out;
}

function frameworksFromGoMod(text: string | null): string[] {
  if (!text) return [];
  const out: string[] = [];
  if (text.includes("github.com/99designs/gqlgen")) out.push("gqlgen");
  if (text.includes("github.com/go-chi/chi")) out.push("chi");
  if (text.includes("github.com/gin-gonic/gin")) out.push("Gin");
  if (text.includes("github.com/labstack/echo")) out.push("Echo");
  return out;
}

function frameworksFromPythonReqs(text: string | null): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const out: string[] = [];
  if (/(^|[\s=])fastapi([\s=]|$)/m.test(lower) || lower.includes("fastapi")) {
    out.push("FastAPI");
  }
  if (lower.includes("django")) out.push("Django");
  if (/(^|[\s=])flask([\s=]|$)/m.test(lower) || lower.includes("flask")) {
    out.push("Flask");
  }
  return out;
}

function scriptsFromPkg(pkg: Record<string, unknown> | null): Record<string, string> {
  if (!pkg || typeof pkg.scripts !== "object" || !pkg.scripts) return {};
  return pkg.scripts as Record<string, string>;
}

function fileStatus(root: string, rel: string): InstructionFileStatus {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    return { path: rel, exists: false, empty: true, bytes: 0 };
  }
  const st = statSync(abs);
  if (st.isDirectory()) {
    let bytes = 0;
    try {
      for (const name of readdirSync(abs)) {
        const child = join(abs, name);
        try {
          bytes += statSync(child).size;
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    return { path: rel, exists: true, empty: bytes === 0, bytes };
  }
  const text = safeRead(abs) ?? "";
  const trimmed = text.trim();
  return {
    path: rel,
    exists: true,
    empty: trimmed.length === 0,
    bytes: Buffer.byteLength(text, "utf8"),
  };
}

function collectWorkspaces(root: string, layout: string[]): WorkspaceHint[] {
  const dirs = [".", ...layout];
  const out: WorkspaceHint[] = [];

  for (const dir of dirs) {
    const abs = dir === "." ? root : join(root, dir);
    const label = dir === "." ? "." : dir;
    const pkg = parseJsonObject(safeRead(join(abs, "package.json")));
    const nodePm = detectNodePackageManager(abs);
    const goMod = safeRead(join(abs, "go.mod"));
    const req =
      safeRead(join(abs, "requirements.txt")) ??
      safeRead(join(abs, "requirements-test.txt"));
    const pyproject = existsSync(join(abs, "pyproject.toml"));

    if (nodePm && pkg) {
      out.push({
        dir: label,
        ecosystem: nodePm,
        frameworks: frameworksFromPkg(pkg),
        scripts: scriptsFromPkg(pkg),
      });
    }
    if (goMod) {
      out.push({
        dir: label,
        ecosystem: "go",
        frameworks: frameworksFromGoMod(goMod),
        scripts: {},
      });
    }
    if (req || pyproject) {
      out.push({
        dir: label,
        ecosystem: "pip",
        frameworks: frameworksFromPythonReqs(req),
        scripts: {},
      });
    }
  }

  return out;
}

function findNestedAgents(root: string, layout: string[]): InstructionFileStatus[] {
  const rels: string[] = [];
  for (const dir of layout) {
    for (const candidate of [
      `${dir}/AGENTS.md`,
      `${dir}/.cursor/AGENTS.md`,
    ]) {
      const st = fileStatus(root, candidate);
      if (st.exists && !st.empty) rels.push(candidate);
    }
  }
  return rels.map((rel) => fileStatus(root, rel));
}

function rootPackageManager(
  root: string,
  workspaces: WorkspaceHint[],
): PackageManager {
  const atRoot = detectNodePackageManager(root);
  if (atRoot) return atRoot;
  const node = workspaces.filter(
    (w) =>
      w.ecosystem === "npm" ||
      w.ecosystem === "pnpm" ||
      w.ecosystem === "yarn" ||
      w.ecosystem === "bun",
  );
  if (node.length === 1) return node[0].ecosystem as PackageManager;
  return "unknown";
}

/** Collect Make targets from `.PHONY:` lists and `name:` rules. */
export function parseMakefileTargets(text: string | null): string[] {
  if (!text) return [];
  const targets = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const phony = line.match(/^\.PHONY:\s*(.+)$/);
    if (phony) {
      for (const t of phony[1].trim().split(/\s+/)) {
        if (t && !t.startsWith("%")) targets.add(t);
      }
      continue;
    }
    if (/^\t/.test(line) || line.startsWith("#") || !line.trim()) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(?:[^=]|$)/);
    if (m) targets.add(m[1]);
  }
  return [...targets].slice(0, 16);
}

/** Short blurb from README for AGENTS overview — not a full summary. */
export function readmeBlurbFrom(text: string | null): string | null {
  if (!text) return null;
  let title: string | null = null;
  let body: string | null = null;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) {
      if (body) break;
      continue;
    }
    if (/^<!--/.test(t) || /^\[!\[/.test(t)) continue;
    if (/^#+\s+/.test(t)) {
      if (!title) title = t.replace(/^#+\s+/, "").trim();
      continue;
    }
    body = t.replace(/^>\s*/, "");
    break;
  }
  const joined = [title, body].filter(Boolean).join(" — ").replace(/\s+/g, " ").trim();
  if (joined.length < 8) return null;
  return joined.length > 220 ? `${joined.slice(0, 217)}…` : joined;
}

/**
 * Local-only repo scan. Never sends data off-machine.
 * Shallow walk only — enough signals for instruction-file planning.
 */
export function scanRepo(rootInput: string): ScanResult {
  const root = resolve(rootInput);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`yabgu: root is not a directory: ${root}`);
  }

  const pkg = parseJsonObject(safeRead(join(root, "package.json")));
  const layout = listTopDirs(root);
  const workspaces = collectWorkspaces(root, layout);
  const languages = sampleLanguages(root);
  const frameworks = [
    ...new Set([
      ...frameworksFromPkg(pkg),
      ...(pkg && layout.includes("src") && layout.includes("app")
        ? ["app+src layout"]
        : []),
      ...workspaces.flatMap((w) => w.frameworks),
    ]),
  ];
  const packageManager = rootPackageManager(root, workspaces);
  const scripts = scriptsFromPkg(pkg);

  const instructionFiles = INSTRUCTION_CANDIDATES.map((p) => fileStatus(root, p));
  const nestedInstructions = findNestedAgents(root, layout);
  const makefileText = safeRead(join(root, "Makefile"));
  const hasMakefile = makefileText != null;
  const makefileTargets = parseMakefileTargets(makefileText);
  const readmeBlurb = readmeBlurbFrom(
    safeRead(join(root, "README.md")) ?? safeRead(join(root, "readme.md")),
  );

  const hasCi =
    existsSync(join(root, ".github", "workflows")) ||
    existsSync(join(root, ".gitlab-ci.yml")) ||
    existsSync(join(root, "azure-pipelines.yml"));

  const notes: string[] = [];
  if (!pkg && workspaces.length === 0 && !hasMakefile) {
    notes.push("No readable package.json / go.mod / requirements — commands section must be filled manually.");
  } else if (!pkg && workspaces.length > 0) {
    notes.push(
      "No package.json at repo root (monorepo). Commands live in nested workspaces — do not treat the stack as empty.",
    );
  }
  if (nestedInstructions.length > 0) {
    notes.push(
      `Nested instruction file(s) found (${nestedInstructions.map((f) => f.path).join(", ")}). They do not replace a missing root AGENTS.md for agents opened at the repo root.`,
    );
  }
  if (languages.length === 0) notes.push("No common source extensions found in shallow scan.");
  if (basename(root) === "yabgu") {
    notes.push("Scanning the yabgu kit itself — prefer a consumer project root.");
  }

  return {
    root,
    packageManager,
    languages,
    frameworks,
    scripts,
    layout,
    instructionFiles,
    nestedInstructions,
    workspaces,
    hasMakefile,
    makefileTargets,
    readmeBlurb,
    hasCi,
    notes,
  };
}

function ecosystemLabel(e: Ecosystem): string {
  switch (e) {
    case "go":
      return "Go modules";
    case "pip":
      return "pip";
    default:
      return e;
  }
}

/** Agent-facing scan summary. Other-host files are not a todo. */
export function formatScanReport(
  scan: ScanResult,
  session: HostSession = resolveHostSession(),
): string {
  const classified = classifyInstructionFiles(scan.instructionFiles, session);
  const workspaceLines =
    scan.workspaces.length === 0
      ? "- (none detected)"
      : scan.workspaces.map((w) => {
          const where = w.dir === "." ? "repo root" : `\`${w.dir}/\``;
          const fw = w.frameworks.length ? `; ${w.frameworks.join(", ")}` : "";
          const scriptN = Object.keys(w.scripts).length;
          const scripts = scriptN ? `; ${scriptN} npm script(s)` : "";
          return `- ${where}: ${ecosystemLabel(w.ecosystem)}${fw}${scripts}`;
        });

  const nested =
    scan.nestedInstructions.length > 0
      ? scan.nestedInstructions.map((f) => `- \`${f.path}\` (${f.bytes} bytes)`).join("\n")
      : "- (none)";

  const missing =
    classified.missingForSession.length > 0
      ? classified.missingForSession.map((p) => `- \`${p}\``).join("\n")
      : "- (none)";

  const optional =
    classified.optionalForSession.length > 0
      ? classified.optionalForSession.map((p) => `- \`${p}\` (optional)`).join("\n")
      : "- (none)";

  const other =
    classified.otherHostAbsent.length > 0
      ? classified.otherHostAbsent.map((p) => `\`${p}\``).join(", ")
      : "(none)";

  const fw =
    scan.frameworks.length > 0 ? scan.frameworks.join(", ") : "(none in shallow scan)";
  const langs =
    scan.languages.length > 0 ? scan.languages.join(", ") : "(none)";

  const make =
    scan.makefileTargets.length > 0
      ? scan.makefileTargets.map((t) => `make ${t}`).join(", ")
      : scan.hasMakefile
        ? "yes (no targets parsed)"
        : "no";

  return [
    `# Yabgu scan — ${scan.root}`,
    "",
    bestPracticesFor(practiceContextFromScan(scan, session)),
    "",
    PRESENT_TO_USER,
    "",
    session.loadsNote,
    session.modelNote,
    "",
    "## Stack",
    "",
    `- Languages: ${langs}`,
    `- Frameworks: ${fw}`,
    `- Root package manager: ${scan.packageManager}`,
    `- Makefile: ${make}`,
    `- README blurb: ${scan.readmeBlurb ?? "(none)"}`,
    `- CI: ${scan.hasCi ? "yes" : "no"}`,
    `- Top dirs: ${scan.layout.join(", ") || "(none)"}`,
    "",
    "## Workspaces",
    "",
    ...workspaceLines,
    "",
    "## This session — instruction files",
    "",
    "Missing (only these are a gap):",
    missing,
    "",
    "Optional for this host:",
    optional,
    "",
    "Nested AGENTS.md already present:",
    nested,
    "",
    "## Other hosts — not a todo",
    "",
    other,
    "",
    "Do not create those files unless the user said they use that tool.",
    "",
    ...(scan.notes.length
      ? ["## Notes", "", ...scan.notes.map((n) => `- ${n}`), ""]
      : []),
  ].join("\n");
}
