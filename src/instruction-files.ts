import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export type InstructionDoc = {
  rel: string;
  text: string;
};

function readIfFile(path: string): string | null {
  try {
    if (!existsSync(path) || !statSync(path).isFile()) return null;
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function collectDirMarkdown(
  root: string,
  dir: string,
  exts: RegExp,
): InstructionDoc[] {
  const out: InstructionDoc[] = [];
  const abs = join(root, dir);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) return out;
  try {
    for (const name of readdirSync(abs)) {
      if (!exts.test(name)) continue;
      const text = readIfFile(join(abs, name));
      if (text != null) out.push({ rel: `${dir}/${name}`, text });
    }
  } catch {
    /* ignore */
  }
  return out;
}

/**
 * Collect always-on / adapter instruction markdown under a project root.
 * Local-only; shallow — top-level files + known rule dirs (not nested skills body scan unless requested).
 */
export function collectInstructionDocs(
  root: string,
  opts?: { includeSkills?: boolean },
): InstructionDoc[] {
  const out: InstructionDoc[] = [];
  const top = [
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    ".github/copilot-instructions.md",
    ".clinerules",
  ];
  for (const rel of top) {
    const text = readIfFile(join(root, rel));
    if (text != null) out.push({ rel, text });
  }

  for (const dir of [
    ".cursor/rules",
    ".claude/rules",
    ".devin/rules",
    ".windsurf/rules",
    ".clinerules",
    ".github/instructions",
  ]) {
    out.push(
      ...collectDirMarkdown(
        root,
        dir,
        dir === ".cursor/rules"
          ? /\.(md|mdc)$/i
          : dir === ".github/instructions"
            ? /\.instructions\.md$/i
            : /\.md$/i,
      ),
    );
  }

  if (opts?.includeSkills) {
    for (const dir of [".cursor/skills", ".claude/skills"]) {
      const abs = join(root, dir);
      if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
      try {
        for (const name of readdirSync(abs)) {
          const skill = join(abs, name, "SKILL.md");
          const text = readIfFile(skill);
          if (text != null) out.push({ rel: `${dir}/${name}/SKILL.md`, text });
        }
      } catch {
        /* ignore */
      }
    }
  }

  return out;
}
