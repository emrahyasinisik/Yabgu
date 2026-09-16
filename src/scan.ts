import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export type InstructionFileStatus = {
  path: string;
  exists: boolean;
  empty: boolean;
  bytes: number;
};

export type ScanResult = {
  root: string;
  packageManager: PackageManager;
  languages: string[];
  frameworks: string[];
  scripts: Record<string, string>;
  layout: string[];
  instructionFiles: InstructionFileStatus[];
  hasCi: boolean;
  notes: string[];
};

const INSTRUCTION_CANDIDATES = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  ".github/copilot-instructions.md",
  ".cursor/rules",
  ".claude/rules",
  ".claude/skills",
  ".cursor/skills",
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

function detectPackageManager(root: string): PackageManager {
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock")))
    return "bun";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
  if (existsSync(join(root, "package.json"))) return "npm";
  return "unknown";
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

function detectFrameworks(pkg: Record<string, unknown> | null, layout: string[]): string[] {
  const out = new Set<string>();
  const deps = {
    ...(typeof pkg?.dependencies === "object" && pkg.dependencies
      ? (pkg.dependencies as Record<string, string>)
      : {}),
    ...(typeof pkg?.devDependencies === "object" && pkg.devDependencies
      ? (pkg.devDependencies as Record<string, string>)
      : {}),
  };
  if (deps.react || deps["react-dom"]) out.add("React");
  if (deps.next) out.add("Next.js");
  if (deps.vue) out.add("Vue");
  if (deps.express) out.add("Express");
  if (deps.vite) out.add("Vite");
  if (deps["@nestjs/core"]) out.add("NestJS");
  if (deps.prisma || deps["@prisma/client"]) out.add("Prisma");
  if (layout.includes("src") && layout.includes("app")) out.add("app+src layout");
  return [...out];
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

/**
 * Local-only repo scan. Never sends data off-machine.
 * Shallow walk only — enough signals for instruction-file planning.
 */
export function scanRepo(rootInput: string): ScanResult {
  const root = resolve(rootInput);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`yabgu: root is not a directory: ${root}`);
  }

  const pkgRaw = safeRead(join(root, "package.json"));
  let pkg: Record<string, unknown> | null = null;
  if (pkgRaw) {
    try {
      pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
    } catch {
      pkg = null;
    }
  }

  const scripts =
    pkg && typeof pkg.scripts === "object" && pkg.scripts
      ? (pkg.scripts as Record<string, string>)
      : {};

  const layout = listTopDirs(root);
  const languages = sampleLanguages(root);
  const frameworks = detectFrameworks(pkg, layout);
  const packageManager = detectPackageManager(root);

  const instructionFiles = INSTRUCTION_CANDIDATES.map((p) => fileStatus(root, p));

  const hasCi =
    existsSync(join(root, ".github", "workflows")) ||
    existsSync(join(root, ".gitlab-ci.yml")) ||
    existsSync(join(root, "azure-pipelines.yml"));

  const notes: string[] = [];
  if (!pkg) notes.push("No readable package.json — commands section must be filled manually.");
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
    hasCi,
    notes,
  };
}
