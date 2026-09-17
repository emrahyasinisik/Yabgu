import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

export type ApplyFile = {
  /** Path relative to root (e.g. AGENTS.md). */
  path: string;
  content: string;
};

export type ApplyResult = {
  root: string;
  written: string[];
  skipped: Array<{ path: string; reason: string }>;
};

/** Instruction files only — apply is not a general write tool. */
const ALLOWED_EXACT = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  ".github/copilot-instructions.md",
  ".clinerules",
  ".gemini/settings.json",
]);

const ALLOWED_PATTERNS: RegExp[] = [
  /^\.github\/instructions\/[^/]+\.instructions\.md$/i,
  /^\.cursor\/rules\/[^/]+\.mdc$/i,
  /^\.cursor\/skills\/[^/]+\/SKILL\.md$/i,
  /^\.claude\/rules\/[^/]+\.md$/i,
  /^\.claude\/skills\/[^/]+\/SKILL\.md$/i,
  /^\.devin\/rules\/[^/]+\.md$/i,
  /^\.windsurf\/rules\/[^/]+\.md$/i,
  /^\.clinerules\/[^/]+\.md$/i,
];

/** Codex combined AGENTS.md ceiling is 32 KiB; keep a single apply well under that. */
export const MAX_APPLY_FILE_BYTES = 32 * 1024;
export const MAX_APPLY_FILES = 20;

function normalizeRel(rel: string): string {
  return rel.replace(/\\/g, "/").replace(/^\.\//, "");
}

/** True only for native instruction / adapter / skill paths this kit owns. */
export function isAllowedInstructionPath(rel: string): boolean {
  const n = normalizeRel(rel);
  if (!n || n.endsWith("/") || n.includes("..") || n.includes("\0")) {
    return false;
  }
  if (ALLOWED_EXACT.has(n)) return true;
  return ALLOWED_PATTERNS.some((re) => re.test(n));
}

function assertInsideRoot(root: string, rel: string): string {
  const abs = resolve(root, rel);
  const rootAbs = resolve(root);
  const prefix = rootAbs.endsWith(sep) ? rootAbs : rootAbs + sep;
  if (abs !== rootAbs && !abs.startsWith(prefix)) {
    throw new Error(`yabgu: path escapes root: ${rel}`);
  }
  if (rel.includes("..")) {
    throw new Error(`yabgu: path must not contain '..': ${rel}`);
  }
  return abs;
}

/**
 * Write instruction files locally after explicit confirmation.
 * Never overwrites non-empty files unless overwrite=true.
 */
export function applyFiles(
  rootInput: string,
  files: ApplyFile[],
  opts: { confirmed: boolean; overwrite?: boolean },
): ApplyResult {
  if (!opts.confirmed) {
    throw new Error(
      "yabgu: refuse to write — set confirmed=true only after the user approved each file.",
    );
  }
  if (!files.length) {
    throw new Error("yabgu: no files to write");
  }
  if (files.length > MAX_APPLY_FILES) {
    throw new Error(
      `yabgu: too many files (${files.length}); max ${MAX_APPLY_FILES} per apply`,
    );
  }

  const root = resolve(rootInput);
  const written: string[] = [];
  const skipped: Array<{ path: string; reason: string }> = [];
  const overwrite = opts.overwrite === true;

  for (const file of files) {
    const rel = normalizeRel(file.path);
    if (rel.includes("..")) {
      throw new Error(`yabgu: path must not contain '..': ${rel}`);
    }
    if (!rel || rel.endsWith("/")) {
      skipped.push({ path: rel, reason: "directory paths are not written by apply" });
      continue;
    }
    if (!isAllowedInstructionPath(rel)) {
      skipped.push({
        path: rel,
        reason:
          "not an instruction/adapter/skill path (AGENTS.md, CLAUDE.md, GEMINI.md, .gemini/settings.json, .github/copilot-instructions.md, .cursor/rules|skills, .claude/rules|skills, .devin/rules, .windsurf/rules, .clinerules)",
      });
      continue;
    }
    if (!file.content || !file.content.trim()) {
      skipped.push({ path: rel, reason: "empty content" });
      continue;
    }
    const bytes = Buffer.byteLength(file.content, "utf8");
    if (bytes > MAX_APPLY_FILE_BYTES) {
      skipped.push({
        path: rel,
        reason: `content ${bytes} bytes exceeds ${MAX_APPLY_FILE_BYTES} (instruction files must stay small)`,
      });
      continue;
    }

    const abs = assertInsideRoot(root, rel);
    if (existsSync(abs)) {
      const existing = readFileSync(abs, "utf8");
      if (existing.trim().length > 0 && !overwrite) {
        skipped.push({
          path: rel,
          reason: "non-empty file exists (pass overwrite=true only if user asked)",
        });
        continue;
      }
    }

    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.content, "utf8");
    written.push(rel);
  }

  return { root, written, skipped };
}

/** Resolve a path join helper for tests. */
export function joinRoot(root: string, rel: string): string {
  return join(resolve(root), rel);
}
