import { existsSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Host-advertised workspace roots (MCP `roots/list`), if the client supports them.
 * Null means "unknown — do not treat as a sandbox".
 */
export type WorkspaceRoots = string[] | null;

function isDir(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function normalizeForCompare(path: string): string {
  const abs = resolve(path);
  return process.platform === "win32" ? abs.toLowerCase() : abs;
}

/** Convert a `file://` URI (or a plain path) to a filesystem path. */
export function uriToFsPath(uri: string): string {
  if (uri.startsWith("file:")) {
    try {
      return fileURLToPath(uri);
    } catch {
      /* fall through */
    }
  }
  return uri;
}

/** Claude Code stdio servers get CLAUDE_PROJECT_DIR (official MCP docs). */
export function envProjectDir(): string | null {
  const raw = process.env.CLAUDE_PROJECT_DIR?.trim();
  if (raw && isDir(raw)) return resolve(raw);
  return null;
}

/**
 * Default workspace when the tool caller omits `root`.
 * Prefer an explicit env project dir over process.cwd() (npx cwd is often the wrong folder).
 */
export function defaultWorkspaceRoot(
  allowedRoots: WorkspaceRoots = null,
): string {
  if (allowedRoots && allowedRoots.length > 0) {
    const first = allowedRoots.find((r) => isDir(r));
    if (first) return resolve(first);
  }
  const fromEnv = envProjectDir();
  if (fromEnv) return fromEnv;
  return resolve(process.cwd());
}

/**
 * Resolve the project root for scan/plan/apply/measure.
 * If `root` is omitted, use MCP roots → CLAUDE_PROJECT_DIR → cwd.
 */
export function resolveProjectRoot(
  root: string | undefined,
  allowedRoots: WorkspaceRoots = null,
): string {
  const abs = root?.trim()
    ? resolve(root.trim())
    : defaultWorkspaceRoot(allowedRoots);

  if (!isDir(abs)) {
    throw new Error(`yabgu: root is not a directory: ${abs}`);
  }

  assertRootAllowed(abs, allowedRoots);
  return abs;
}

/** If the host advertised roots, refuse paths outside that set. */
export function assertRootAllowed(
  root: string,
  allowedRoots: WorkspaceRoots,
): void {
  if (!allowedRoots || allowedRoots.length === 0) return;

  const abs = normalizeForCompare(root);
  const ok = allowedRoots.some((candidate) => {
    const base = normalizeForCompare(candidate);
    const prefix = base.endsWith(sep) ? base : base + sep;
    return abs === base || abs.startsWith(prefix);
  });

  if (!ok) {
    throw new Error(
      `yabgu: root is outside host workspace roots: ${resolve(root)}`,
    );
  }
}
