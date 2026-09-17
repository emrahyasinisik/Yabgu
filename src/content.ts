import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── Package root ──────────────────────────────────────────────
// At runtime dist/content.js sits one level below the package root.
// We resolve up so docs/, templates/, tools/ are reachable regardless
// of the consumer's cwd.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = join(__dirname, "..");

// ── Template IDs ──────────────────────────────────────────────

export const TEMPLATE_IDS = [
  "agents",
  "claude",
  "gemini",
  "gemini-settings",
  "cursor-always",
  "cursor-glob",
  "copilot-instructions",
  "copilot-path",
  "claude-testing",
  "skill",
  "windsurf-style",
  "cline-rules",
  "chatgpt-web",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

const TEMPLATE_PATHS: Record<TemplateId, string> = {
  agents: "templates/AGENTS.md",
  claude: "templates/CLAUDE.md",
  gemini: "templates/GEMINI.md",
  "gemini-settings": "templates/gemini/settings.json",
  "cursor-always": "templates/cursor/always-apply.mdc",
  "cursor-glob": "templates/cursor/glob-rule.mdc",
  "copilot-instructions": "templates/copilot/copilot-instructions.md",
  "copilot-path": "templates/copilot/path-specific.instructions.md",
  "claude-testing": "templates/claude/testing.md",
  skill: "templates/skills/SKILL.md",
  "windsurf-style": "templates/windsurf/style.md",
  "cline-rules": "templates/cline/clinerules.md",
  "chatgpt-web": "templates/chatgpt/web-instructions.md",
};

// ── Host IDs ──────────────────────────────────────────────────

export const HOST_IDS = [
  "cursor",
  "claude",
  "codex",
  "copilot",
  "gemini",
  "grok",
  "windsurf",
  "others",
] as const;

export type HostId = (typeof HOST_IDS)[number];

const HOST_PATHS: Record<HostId, string> = {
  cursor: "tools/cursor.md",
  claude: "tools/claude.md",
  codex: "tools/chatgpt-codex.md",
  copilot: "tools/github-copilot.md",
  gemini: "tools/gemini.md",
  grok: "tools/grok.md",
  windsurf: "tools/windsurf.md",
  others: "tools/others.md",
};

// ── Readers ───────────────────────────────────────────────────

function read(relPath: string): string {
  try {
    return readFileSync(join(PKG_ROOT, relPath), "utf8");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`yabgu: failed to read ${relPath}: ${detail}`);
  }
}

/** Relative path for a template (for tests / diagnostics). */
export function templateRelPath(id: TemplateId): string {
  return TEMPLATE_PATHS[id];
}

/** Relative path for a host guide (for tests / diagnostics). */
export function hostRelPath(host: HostId): string {
  return HOST_PATHS[host];
}

/** Return a single template by ID. */
export function readTemplate(id: TemplateId): string {
  return read(TEMPLATE_PATHS[id]);
}

/** Return the tool/host guide for a specific host. */
export function readHostGuide(host: HostId): string {
  return read(HOST_PATHS[host]);
}

/** Return all template IDs and their target paths (for listing). */
export function listTemplates(): Array<{ id: TemplateId; copyTo: string }> {
  return [
    { id: "agents", copyTo: "AGENTS.md (project root)" },
    { id: "claude", copyTo: "CLAUDE.md (project root)" },
    { id: "gemini", copyTo: "GEMINI.md (project root)" },
    { id: "gemini-settings", copyTo: ".gemini/settings.json" },
    { id: "cursor-always", copyTo: ".cursor/rules/<name>.mdc" },
    { id: "cursor-glob", copyTo: ".cursor/rules/<name>.mdc" },
    { id: "copilot-instructions", copyTo: ".github/copilot-instructions.md" },
    { id: "copilot-path", copyTo: ".github/instructions/<name>.instructions.md" },
    { id: "claude-testing", copyTo: ".claude/rules/testing.md" },
    { id: "skill", copyTo: ".cursor/skills/<name>/SKILL.md or .claude/skills/<name>/SKILL.md" },
    { id: "windsurf-style", copyTo: ".devin/rules/style.md (or .windsurf/rules/)" },
    { id: "cline-rules", copyTo: ".clinerules or .clinerules/<name>.md" },
    { id: "chatgpt-web", copyTo: "paste into ChatGPT Custom / Project instructions" },
  ];
}

/** Return all host IDs (for listing). */
export function listHosts(): HostId[] {
  return [...HOST_IDS];
}

// ── Get Started (combined / sectional) ────────────────────────

export const GET_STARTED_SECTIONS = [
  "index",
  "writing",
  "matrix",
  "shared",
  "all",
] as const;

export type GetStartedSection = (typeof GET_STARTED_SECTIONS)[number];

function indexSection(): string {
  const templateList = listTemplates()
    .map((t) => `- \`${t.id}\` → ${t.copyTo}`)
    .join("\n");

  const hostList = listHosts()
    .map((h) => `- \`${h}\``)
    .join("\n");

  return [
    "# Yabgu — Get Started",
    "",
    "Use this information to set up instruction files for the current project.",
    "Plan for the MCP host you are in (Cursor vs Gemini CLI vs Claude Code). Host ≠ model: a Gemini model inside Cursor still does not load GEMINI.md.",
    "Prefer sectional calls when tokens matter: `yabgu_get_started` with section `writing`, `matrix`, or `shared`.",
    "Flow: `yabgu_scan` → `yabgu_plan` → show drafts → user approval → `yabgu_apply` (confirmed=true).",
    "Also: `yabgu_template`, `yabgu_host_guide`, `yabgu_host_setup`, `yabgu_measure`, resources `yabgu://…`, prompt `yabgu_setup`.",
    "",
    "## Available templates",
    "",
    templateList,
    "",
    "## Available host guides",
    "",
    hostList,
  ].join("\n");
}

/** One section or the full combined pack. */
export function getStartedSection(section: GetStartedSection = "all"): string {
  switch (section) {
    case "index":
      return indexSection();
    case "writing":
      return read("docs/how-to-write.md");
    case "matrix":
      return read("docs/matrix.md");
    case "shared":
      return read("docs/shared-source-of-truth.md");
    case "all":
      return [
        indexSection(),
        "",
        "---",
        "",
        read("docs/how-to-write.md"),
        "",
        "---",
        "",
        read("docs/matrix.md"),
        "",
        "---",
        "",
        read("docs/shared-source-of-truth.md"),
      ].join("\n");
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

/**
 * Returns the combined "get started" content:
 * writing rules + file matrix + single-source setup guide.
 */
export function getStartedContent(): string {
  return getStartedSection("all");
}
