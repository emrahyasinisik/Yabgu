/**
 * Which instruction files belong to which coding-agent *host* (IDE/CLI),
 * and how to detect that host from the MCP client.
 *
 * Host ≠ model. A Gemini/Claude/GPT model inside Cursor still loads Cursor
 * files. GEMINI.md is Gemini CLI only.
 */

export type HostHint =
  | "cursor"
  | "claude"
  | "codex"
  | "copilot"
  | "gemini"
  | "windsurf"
  | "grok";

export const HOST_HINTS = [
  "cursor",
  "claude",
  "codex",
  "copilot",
  "gemini",
  "windsurf",
  "grok",
] as const satisfies readonly HostHint[];

export type HostFileRole = "required" | "shared" | "optional";

export type HostFile = {
  path: string;
  role: HostFileRole;
};

/** Native files this host actually loads. Sourced from docs/matrix.md. */
export const HOST_FILES: Record<HostHint, readonly HostFile[]> = {
  cursor: [
    { path: "AGENTS.md", role: "shared" },
    { path: ".cursor/rules", role: "optional" },
    { path: ".cursor/skills", role: "optional" },
  ],
  claude: [
    { path: "CLAUDE.md", role: "required" },
    { path: "AGENTS.md", role: "shared" },
    { path: ".claude/rules", role: "optional" },
    { path: ".claude/skills", role: "optional" },
  ],
  codex: [{ path: "AGENTS.md", role: "shared" }],
  copilot: [
    { path: "AGENTS.md", role: "shared" },
    { path: ".github/copilot-instructions.md", role: "required" },
  ],
  gemini: [
    { path: "GEMINI.md", role: "required" },
    { path: ".gemini/settings.json", role: "optional" },
    { path: "AGENTS.md", role: "shared" },
  ],
  windsurf: [
    { path: "AGENTS.md", role: "shared" },
    { path: ".devin/rules", role: "optional" },
    { path: ".windsurf/rules", role: "optional" },
  ],
  grok: [{ path: "AGENTS.md", role: "shared" }],
};

/** Scan candidates that are host-specific adapters (not shared AGENTS.md). */
export const OTHER_HOST_PATHS = [
  "CLAUDE.md",
  "GEMINI.md",
  ".github/copilot-instructions.md",
  ".gemini/settings.json",
  ".cursor/rules",
  ".cursor/skills",
  ".claude/rules",
  ".claude/skills",
  ".devin/rules",
  ".windsurf/rules",
  ".clinerules",
] as const;

const PATH_HOSTS: Record<string, HostHint[]> = (() => {
  const map: Record<string, HostHint[]> = {};
  for (const host of HOST_HINTS) {
    for (const file of HOST_FILES[host]) {
      if (file.path === "AGENTS.md") continue;
      (map[file.path] ??= []).push(host);
    }
  }
  return map;
})();

export type SessionSource = "clientInfo" | "env" | "unknown";

export type HostSession = {
  clientName: string | null;
  host: HostHint | null;
  source: SessionSource;
  /** One line: this host does not load the other adapters. */
  loadsNote: string;
  modelNote: string;
};

const MODEL_NOTE =
  "Host ≠ model: the model inside the IDE does not change which files load. A Gemini model in Cursor still does not read GEMINI.md.";

function loadsNoteFor(host: HostHint | null): string {
  switch (host) {
    case "cursor":
      return "This session is Cursor. It loads AGENTS.md and .cursor/rules — not GEMINI.md or CLAUDE.md.";
    case "gemini":
      return "This session is Gemini CLI. It loads GEMINI.md. AGENTS.md is ignored unless .gemini/settings.json sets context.fileName.";
    case "claude":
      return "This session is Claude Code. It loads CLAUDE.md (bridge AGENTS.md with @AGENTS.md). It does not load GEMINI.md or Cursor rules.";
    case "codex":
      return "This session is Codex. Root AGENTS.md is enough. It does not load GEMINI.md.";
    case "copilot":
      return "This session is GitHub Copilot. It loads AGENTS.md and .github/copilot-instructions.md. GEMINI.md is not the Copilot file.";
    case "windsurf":
      return "This session is Windsurf/Cascade. It loads AGENTS.md and .devin/rules.";
    case "grok":
      return "This session is Grok Build. Root AGENTS.md is enough. It does not load GEMINI.md.";
    default:
      return "MCP host was not detected. Treat AGENTS.md as the only required file. Do not create GEMINI.md/CLAUDE.md unless the user named that host.";
  }
}

/**
 * Map MCP `clientInfo.name` to a host.
 * Specific names first. Do not map generic "Visual Studio Code" — Cursor is a
 * VS Code fork and would be mis-detected as Copilot.
 *
 * Known names: Gemini CLI `gemini-cli-mcp-client`
 * (https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/tools/mcp-client.ts).
 */
export function detectHostFromClientName(
  name: string | undefined | null,
): HostHint | null {
  if (!name?.trim()) return null;
  const n = name.trim().toLowerCase();

  const patterns: Array<[RegExp, HostHint]> = [
    [/gemini-cli|gemini cli/, "gemini"],
    [/claude-code|claude_code/, "claude"],
    [/github-copilot|github copilot|copilot-cli/, "copilot"],
    [/\bcursor\b/, "cursor"],
    [/windsurf|\bcascade\b/, "windsurf"],
    [/\bgrok\b/, "grok"],
    [/\bcodex\b|\bchatgpt\b/, "codex"],
    [/\bclaude\b/, "claude"],
    [/\bgemini\b/, "gemini"],
    [/\bcopilot\b/, "copilot"],
  ];

  for (const [re, host] of patterns) {
    if (re.test(n)) return host;
  }
  return null;
}

/**
 * Unambiguous env only. Do not use TERM_PROGRAM=vscode (Cursor and VS Code
 * share it). CLAUDE_PROJECT_DIR is documented for Claude Code MCP stdio.
 * CURSOR_TRACE_ID / CURSOR_AGENT are inherited by Cursor-spawned processes.
 */
export function detectHostFromEnv(
  env: NodeJS.Dict<string> = process.env,
): HostHint | null {
  const claudeDir = env.CLAUDE_PROJECT_DIR?.trim();
  if (claudeDir) return "claude";
  if (env.CURSOR_TRACE_ID?.trim() || env.CURSOR_AGENT?.trim()) return "cursor";
  return null;
}

export function resolveHostSession(opts?: {
  clientName?: string | null;
  env?: NodeJS.Dict<string>;
}): HostSession {
  const clientName = opts?.clientName?.trim() || null;
  const fromClient = detectHostFromClientName(clientName);
  if (fromClient) {
    return {
      clientName,
      host: fromClient,
      source: "clientInfo",
      loadsNote: loadsNoteFor(fromClient),
      modelNote: MODEL_NOTE,
    };
  }
  const fromEnv = detectHostFromEnv(opts?.env ?? process.env);
  if (fromEnv) {
    return {
      clientName,
      host: fromEnv,
      source: "env",
      loadsNote: loadsNoteFor(fromEnv),
      modelNote: MODEL_NOTE,
    };
  }
  return {
    clientName,
    host: null,
    source: "unknown",
    loadsNote: loadsNoteFor(null),
    modelNote: MODEL_NOTE,
  };
}

/** Default plan hosts: this session only. Empty → AGENTS.md, no other-host adapters. */
export function defaultPlanHosts(
  session: HostSession,
  hostsInput?: HostHint[],
): HostHint[] {
  if (hostsInput && hostsInput.length > 0) return [...new Set(hostsInput)];
  if (session.host) return [session.host];
  return [];
}

export function nativePathsFor(host: HostHint | null): Set<string> {
  if (!host) return new Set(["AGENTS.md"]);
  return new Set(HOST_FILES[host].map((f) => f.path));
}

export function hostsForPath(path: string): HostHint[] {
  if (path === "AGENTS.md") return [...HOST_HINTS];
  return PATH_HOSTS[path] ?? [];
}

export type FileClass = {
  missingForSession: string[];
  optionalForSession: string[];
  presentForSession: string[];
  otherHostAbsent: string[];
};

export function classifyInstructionFiles(
  files: Array<{ path: string; exists: boolean; empty: boolean }>,
  session: HostSession,
): FileClass {
  const native = nativePathsFor(session.host);
  const missingForSession: string[] = [];
  const optionalForSession: string[] = [];
  const presentForSession: string[] = [];
  const otherHostAbsent: string[] = [];

  const roleOf = (path: string): HostFileRole | null => {
    if (!session.host) return path === "AGENTS.md" ? "shared" : null;
    return HOST_FILES[session.host].find((f) => f.path === path)?.role ?? null;
  };

  for (const f of files) {
    const inSession = native.has(f.path);
    const present = f.exists && !f.empty;
    if (inSession) {
      if (present) presentForSession.push(f.path);
      else if (roleOf(f.path) === "optional") optionalForSession.push(f.path);
      else missingForSession.push(f.path);
      continue;
    }
    if (!present && OTHER_HOST_PATHS.includes(f.path as (typeof OTHER_HOST_PATHS)[number])) {
      otherHostAbsent.push(f.path);
    }
  }

  return {
    missingForSession,
    optionalForSession,
    presentForSession,
    otherHostAbsent,
  };
}

export function planWarnings(
  session: HostSession,
  hosts: HostHint[],
  existingPresent: string[],
): string[] {
  const warnings: string[] = [];
  warnings.push(session.loadsNote);
  warnings.push(session.modelNote);

  if (session.host && hosts.some((h) => h !== session.host)) {
    const extras = hosts.filter((h) => h !== session.host);
    warnings.push(
      `Also planning for ${extras.join(", ")}. Those adapters are not loaded in this ${session.host} session — add them only if the team uses those tools.`,
    );
  }

  if (session.host === "cursor" && existingPresent.includes("GEMINI.md")) {
    warnings.push(
      "GEMINI.md exists but Cursor does not load it. Keep shared rules in AGENTS.md.",
    );
  }
  if (session.host === "gemini" && !existingPresent.includes("GEMINI.md")) {
    warnings.push(
      "Gemini CLI will not see project rules until GEMINI.md exists (or .gemini/settings.json lists AGENTS.md).",
    );
  }
  if (session.host === "claude" && !existingPresent.includes("CLAUDE.md")) {
    warnings.push(
      "Claude Code does not load AGENTS.md directly. CLAUDE.md should start with @AGENTS.md.",
    );
  }
  return warnings;
}
