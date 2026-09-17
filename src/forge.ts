import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { collectInstructionDocs } from "./instruction-files.js";

export type SkillHost = "cursor" | "claude";

export type ForgeCandidate = {
  /** Suggested skill folder slug */
  name: string;
  heading: string;
  sourceFile: string;
  excerpt: string;
  stepCount: number;
  reason: string;
};

export type ForgeDraft = {
  name: string;
  description: string;
  /** Relative path for yabgu_apply */
  path: string;
  content: string;
  /** Optional AGENTS trim tip — never auto-edited */
  trimHint?: string;
};

export type ForgeReport = {
  root: string | null;
  mode: "text" | "agents";
  candidates: ForgeCandidate[];
  draft: ForgeDraft | null;
  notes: string[];
};

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "workflow";
}

function firstSentence(text: string, max = 140): string {
  const cleaned = text
    .replace(/^#+\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const m = cleaned.match(/^.{8,140}?[.!?]/);
  if (m) return m[0].trim();
  return cleaned.slice(0, max).trim();
}

function extractSteps(procedure: string): string[] {
  const lines = procedure.split(/\r?\n/).map((l) => l.trimEnd());
  const numbered: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*(?:\d+[\.\)]\s+|-\s+\[[ x]\]\s+|-\s+)(.+)/i);
    if (m?.[1]) numbered.push(m[1].trim());
  }
  if (numbered.length >= 2) return numbered;

  // Fallback: non-empty paragraphs as rough steps
  const paras = procedure
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 12 && !p.startsWith("#"));
  return paras.slice(0, 12);
}

function buildSkillMarkdown(opts: {
  name: string;
  description: string;
  steps: string[];
  when?: string[];
}): string {
  const when =
    opts.when && opts.when.length
      ? opts.when
      : [
          `User asks to run the ${opts.name.replace(/-/g, " ")} workflow`,
          "Agent is about to follow a multi-step procedure that should not live in every session",
        ];

  const stepBlock =
    opts.steps.length > 0
      ? opts.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "1. Read the relevant files.\n2. Follow the repo's `AGENTS.md` commands.\n3. Produce the output below.";

  return `---
name: ${opts.name}
description: ${opts.description}
---

# ${opts.name.replace(/-/g, " ")}

Agent Skills are for procedures that should not live in every session.

## When to use

${when.map((w) => `- ${w}`).join("\n")}

## Steps

${stepBlock}

## Output

\`\`\`markdown
- Summary:
- Checks run:
- Follow-ups:
\`\`\`
`;
}

/**
 * Draft a SKILL.md from free-form procedure text (chat summary, pasted runbook).
 * Does not write — pass draft to yabgu_apply after user approval.
 */
export function forgeSkillFromText(opts: {
  procedure: string;
  name?: string;
  description?: string;
  host?: SkillHost;
}): ForgeDraft {
  const procedure = opts.procedure?.trim();
  if (!procedure || procedure.length < 20) {
    throw new Error(
      "yabgu: procedure text too short — paste the multi-step workflow (or summarize the chat procedure).",
    );
  }

  const steps = extractSteps(procedure);
  const name = slugify(opts.name?.trim() || firstSentence(procedure, 40) || "workflow");
  const description =
    opts.description?.trim() ||
    `Use when running the ${name.replace(/-/g, " ")} workflow.`;
  const host = opts.host ?? "cursor";
  const path =
    host === "claude"
      ? `.claude/skills/${name}/SKILL.md`
      : `.cursor/skills/${name}/SKILL.md`;

  const whenFromSteps =
    steps.length > 0
      ? [`User asks to ${name.replace(/-/g, " ")}`, firstSentence(steps[0] ?? "", 100)]
      : undefined;

  return {
    name,
    description: description.slice(0, 220),
    path,
    content: buildSkillMarkdown({
      name,
      description: description.slice(0, 220),
      steps,
      when: whenFromSteps,
    }),
    trimHint:
      "After apply: remove the long procedure from AGENTS.md / always-on adapters so it is not loaded every turn.",
  };
}

const PROCEDURE_HEADING =
  /^(#{2,3})\s+(.*(?:deploy|release|runbook|checklist|workflow|publish|migrate|rollback|oncall|incident).*)\s*$/i;

/**
 * Find multi-step blocks in always-on instruction files that belong in a skill.
 */
export function findSkillCandidates(rootInput: string): ForgeCandidate[] {
  const root = resolve(rootInput);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`yabgu: root is not a directory: ${root}`);
  }

  const docs = collectInstructionDocs(root, { includeSkills: false });
  const candidates: ForgeCandidate[] = [];

  for (const doc of docs) {
    // Skip thin adapters that only import
    if (/^@AGENTS\.md\s*$/m.test(doc.text) && doc.text.split(/\r?\n/).length < 25) {
      continue;
    }

    const lines = doc.text.split(/\r?\n/);
    let i = 0;
    while (i < lines.length) {
      // Only ## / ### — H1 is usually the doc title and would swallow the whole file.
      const headingMatch = lines[i]?.match(/^(#{2,3})\s+(.+)\s*$/);
      if (!headingMatch) {
        i += 1;
        continue;
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const isProcedureTitle = PROCEDURE_HEADING.test(lines[i] ?? "");
      const start = i;
      i += 1;
      const body: string[] = [];
      while (i < lines.length) {
        const next = lines[i]?.match(/^(#{1,3})\s+/);
        if (next && next[1].length <= level) break;
        body.push(lines[i] ?? "");
        i += 1;
      }
      void start;

      const bodyText = body.join("\n");
      const steps = extractSteps(bodyText);
      const longEnough = bodyText.trim().length >= 180 || steps.length >= 4;

      if (!longEnough) continue;
      if (!isProcedureTitle && steps.length < 5) continue;

      candidates.push({
        name: slugify(title),
        heading: title,
        sourceFile: doc.rel,
        excerpt: bodyText.trim().slice(0, 400),
        stepCount: steps.length,
        reason: isProcedureTitle
          ? "Procedure-like heading with substantial body — belongs in a skill, not every session"
          : `${steps.length} numbered/list steps in always-on file — extract to a skill`,
      });
    }

    // Also: large numbered lists without a fancy heading
    const looseSteps = extractSteps(doc.text);
    if (
      looseSteps.length >= 8 &&
      !candidates.some((c) => c.sourceFile === doc.rel && c.stepCount >= 8)
    ) {
      candidates.push({
        name: slugify(`${doc.rel.replace(/\W+/g, "-")}-runbook`),
        heading: `Long procedure in ${doc.rel}`,
        sourceFile: doc.rel,
        excerpt: looseSteps.slice(0, 6).map((s, n) => `${n + 1}. ${s}`).join("\n"),
        stepCount: looseSteps.length,
        reason: `${looseSteps.length} list steps in always-on file — likely a runbook`,
      });
    }
  }

  return candidates;
}

/**
 * Skill forge entry: from pasted text, or scan AGENTS/adapters for candidates (+ optional draft).
 */
export function forgeSkill(opts: {
  mode: "text" | "agents";
  root?: string;
  procedure?: string;
  name?: string;
  description?: string;
  host?: SkillHost;
  /** When mode=agents, pick this candidate name/slug to draft */
  pick?: string;
}): ForgeReport {
  const notes: string[] = [
    "Draft only — show the user, then yabgu_apply with confirmed=true (or host elicitation).",
    "Yabgu does not control tone; skills are for multi-step procedures.",
  ];

  if (opts.mode === "text") {
    const draft = forgeSkillFromText({
      procedure: opts.procedure ?? "",
      name: opts.name,
      description: opts.description,
      host: opts.host,
    });
    return {
      root: opts.root ? resolve(opts.root) : null,
      mode: "text",
      candidates: [],
      draft,
      notes,
    };
  }

  const root = opts.root;
  if (!root) {
    throw new Error("yabgu: mode=agents requires root (or omit root for host workspace in MCP).");
  }
  const candidates = findSkillCandidates(root);
  let draft: ForgeDraft | null = null;

  if (opts.pick) {
    const pick = slugify(opts.pick);
    const chosen =
      candidates.find((c) => c.name === pick) ||
      candidates.find((c) => c.name.includes(pick) || pick.includes(c.name));
    if (!chosen) {
      notes.push(`No candidate matched pick="${opts.pick}". Choose from candidates[].name.`);
    } else {
      draft = forgeSkillFromText({
        procedure: `# ${chosen.heading}\n\n${chosen.excerpt}`,
        name: opts.name ?? chosen.name,
        description: opts.description,
        host: opts.host,
      });
      draft.trimHint = `Remove or shorten the “${chosen.heading}” section in \`${chosen.sourceFile}\` after the skill is applied.`;
    }
  } else if (candidates.length === 1) {
    const only = candidates[0]!;
    draft = forgeSkillFromText({
      procedure: `# ${only.heading}\n\n${only.excerpt}`,
      name: opts.name ?? only.name,
      description: opts.description,
      host: opts.host,
    });
    draft.trimHint = `Remove or shorten the “${only.heading}” section in \`${only.sourceFile}\` after the skill is applied.`;
    notes.push("Single candidate auto-drafted; confirm before apply.");
  } else if (candidates.length === 0) {
    notes.push(
      "No procedure-sized blocks found. Pass mode=text with a chat/procedure summary, or add a Deploy/Release section to inspect.",
    );
  } else {
    notes.push(
      `Found ${candidates.length} candidates — call again with pick=<name> to draft one.`,
    );
  }

  return {
    root: resolve(root),
    mode: "agents",
    candidates,
    draft,
    notes,
  };
}

/** Read AGENTS.md helper for tests / CLI. */
export function readAgentsIfPresent(root: string): string | null {
  try {
    const p = resolve(root, "AGENTS.md");
    if (!existsSync(p) || !statSync(p).isFile()) return null;
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
}
