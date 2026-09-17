import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { collectInstructionDocs, type InstructionDoc } from "./instruction-files.js";

export type ConflictSeverity = "high" | "medium" | "low";

export type ConflictHit = {
  topic: string;
  severity: ConflictSeverity;
  summary: string;
  sides: Array<{
    polarity: "forbid" | "require" | "command";
    file: string;
    excerpt: string;
  }>;
  tip: string;
};

export type ConflictReport = {
  root: string;
  filesScanned: string[];
  conflicts: ConflictHit[];
  /** 0 = clean; higher = more opposing rules. */
  conflictCount: number;
  notes: string[];
};

type TopicDef = {
  id: string;
  label: string;
  severity: ConflictSeverity;
  forbid: RegExp[];
  require: RegExp[];
};

/** Opposing directive families — model picks one at random when both fire. */
const TOPICS: TopicDef[] = [
  {
    id: "git_push",
    label: "git push",
    severity: "high",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+(?:[^\n]*\b)?(?:git\s+)?push\b/i,
      /\b(?:do\s+not|don't|never)\s+push\s+to\s+(?:origin|remote|main|master)\b/i,
    ],
    require: [
      /\balways\s+(?:git\s+)?push\b/i,
      /\b(?:must|should)\s+push\s+(?:to\s+)?(?:origin|remote)\b/i,
      /\bpush\s+(?:the\s+)?(?:branch|changes)\s+(?:after|when)\b/i,
    ],
  },
  {
    id: "force_push",
    label: "force push",
    severity: "high",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+(?:[^\n]*\b)?force[\s-]?push\b/i,
      /\b(?:do\s+not|don't|never)\s+[^\n]*\b--force\b/i,
    ],
    require: [
      /\balways\s+force[\s-]?push\b/i,
      /\b(?:should|must)\s+force[\s-]?push\b/i,
    ],
  },
  {
    id: "commit_secrets",
    label: "secrets / .env in git",
    severity: "high",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+commit\s+(?:[^\n]*\b)?(?:secrets?|\.env)\b/i,
      /\b(?:do\s+not|don't|never)\s+(?:add|check\s+in)\s+(?:[^\n]*\b)?\.env\b/i,
    ],
    require: [
      /\bcommit\s+(?:the\s+)?\.env\b/i,
      /\balways\s+include\s+\.env\b/i,
    ],
  },
  {
    id: "add_deps",
    label: "adding dependencies",
    severity: "medium",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+add\s+(?:a\s+)?(?:new\s+)?dependenc/i,
      /\b(?:do\s+not|don't|never)\s+install\s+(?:new\s+)?packages?\b/i,
    ],
    require: [
      /\balways\s+add\s+(?:the\s+)?(?:needed\s+)?dependenc/i,
      /\bfeel\s+free\s+to\s+add\s+(?:npm|packages?|dependenc)/i,
    ],
  },
  {
    id: "public_api",
    label: "public API changes",
    severity: "medium",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+change\s+(?:the\s+)?public\s+api\b/i,
      /\b(?:do\s+not|don't|never)\s+break\s+(?:the\s+)?(?:public\s+)?api\b/i,
    ],
    require: [
      /\bfreely\s+(?:change|break)\s+(?:the\s+)?(?:public\s+)?api\b/i,
      /\balways\s+update\s+(?:the\s+)?public\s+api\b/i,
    ],
  },
  {
    id: "overwrite",
    label: "overwrite existing files",
    severity: "medium",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+overwrite\b/i,
      /\b(?:do\s+not|don't|never)\s+replace\s+(?:existing|non-empty)\b/i,
    ],
    require: [
      /\balways\s+overwrite\b/i,
      /\boverwrite\s+(?:without|freely)\b/i,
    ],
  },
  {
    id: "network_telemetry",
    label: "network / telemetry",
    severity: "high",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+(?:send|upload|exfiltrat)/i,
      /\b(?:do\s+not|don't|never)\s+[^\n]*\btelemetry\b/i,
      /\blocal\s+(?:stdio\s+)?only\b/i,
    ],
    require: [
      /\balways\s+(?:send|upload)\s+(?:telemetry|analytics|usage)\b/i,
      /\breport\s+(?:usage|telemetry)\s+to\s+(?:our|the)\s+server\b/i,
    ],
  },
  {
    id: "tests_before_done",
    label: "running tests",
    severity: "medium",
    forbid: [
      /\b(?:do\s+not|don't|never)\s+run\s+tests?\b/i,
      /\bskip\s+tests?\b/i,
      /\btests?\s+are\s+optional\b/i,
    ],
    require: [
      /\balways\s+run\s+tests?\b/i,
      /\bmust\s+(?:run|pass)\s+tests?\b/i,
      /\bbefore\s+finish(?:ing)?.*\btests?\b/i,
    ],
  },
];

type SideHit = {
  polarity: "forbid" | "require";
  file: string;
  excerpt: string;
};

function dedupeSides(hits: SideHit[]): SideHit[] {
  const seen = new Set<string>();
  const out: SideHit[] = [];
  for (const h of hits) {
    const key = `${h.polarity}|${h.file}|${h.excerpt.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

function lineExcerpt(text: string, index: number, matchLen: number): string {
  const start = text.lastIndexOf("\n", index) + 1;
  let end = text.indexOf("\n", index + matchLen);
  if (end < 0) end = text.length;
  return text.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 160);
}

function findSides(
  docs: InstructionDoc[],
  patterns: RegExp[],
  polarity: "forbid" | "require",
): SideHit[] {
  const hits: SideHit[] = [];
  for (const doc of docs) {
    for (const re of patterns) {
      const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
      const global = new RegExp(re.source, flags);
      let m: RegExpExecArray | null;
      while ((m = global.exec(doc.text)) !== null) {
        // Keep matches on a single line — \s otherwise eats blank lines under "## Do not"
        if (m[0].includes("\n")) continue;
        hits.push({
          polarity,
          file: doc.rel,
          excerpt: lineExcerpt(doc.text, m.index, m[0].length),
        });
        if (hits.length > 40) return hits;
      }
    }
  }
  return hits;
}

const COMMAND_KEYS = ["test", "lint", "typecheck", "build", "start", "dev"] as const;

type CmdHit = { key: string; file: string; command: string };

function extractCommands(docs: InstructionDoc[]): CmdHit[] {
  const out: CmdHit[] = [];
  const fence =
    /```(?:bash|sh|shell|zsh)?\s*\n([\s\S]*?)```/gi;
  for (const doc of docs) {
    let fm: RegExpExecArray | null;
    while ((fm = fence.exec(doc.text)) !== null) {
      const body = fm[1] ?? "";
      for (const line of body.split(/\r?\n/)) {
        const trimmed = line.replace(/^\s*#.*$/, "").trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        for (const key of COMMAND_KEYS) {
          // "npm test", "# test", "pnpm run test", comment labels like "# test"
          const labeled = new RegExp(`^#\\s*${key}\\b`, "i");
          if (labeled.test(line.trim())) {
            // next non-empty in fence handled as separate lines; skip label-only
            continue;
          }
          if (
            new RegExp(
              `(?:npm|pnpm|yarn|bun|cargo|go|make|pytest|vitest|jest)\\b.*\\b${key}\\b|\\b(?:run\\s+)?${key}\\b`,
              "i",
            ).test(trimmed) &&
            !trimmed.startsWith("//")
          ) {
            // Prefer lines that look like the primary command for that key
            if (
              new RegExp(`\\b${key}\\b`, "i").test(trimmed) &&
              /(?:npm|pnpm|yarn|bun|npx|cargo|go|make|pytest|vitest|jest|tsc)\b/i.test(
                trimmed,
              )
            ) {
              out.push({ key, file: doc.rel, command: trimmed.slice(0, 120) });
            }
          }
        }
      }
    }
  }
  return out;
}

function commandConflicts(docs: InstructionDoc[]): ConflictHit[] {
  const hits = extractCommands(docs);
  const byKey = new Map<string, CmdHit[]>();
  for (const h of hits) {
    const list = byKey.get(h.key) ?? [];
    list.push(h);
    byKey.set(h.key, list);
  }

  const conflicts: ConflictHit[] = [];
  for (const [key, list] of byKey) {
    const normalized = new Map<string, CmdHit[]>();
    for (const h of list) {
      const norm = h.command.replace(/\s+/g, " ").trim().toLowerCase();
      const group = normalized.get(norm) ?? [];
      group.push(h);
      normalized.set(norm, group);
    }
    if (normalized.size < 2) continue;
    const sides = [...normalized.values()].flat().slice(0, 6).map((h) => ({
      polarity: "command" as const,
      file: h.file,
      excerpt: h.command,
    }));
    // Only flag when at least two different files disagree (or same file repeated differently)
    const files = new Set(sides.map((s) => s.file));
    if (files.size < 2 && normalized.size < 2) continue;
    conflicts.push({
      topic: `command_${key}`,
      severity: key === "test" || key === "lint" ? "high" : "medium",
      summary: `Different \`${key}\` commands across instruction files`,
      sides,
      tip: `Pick one canonical \`${key}\` command in AGENTS.md; adapters should point to it, not invent a second command.`,
    });
  }
  return conflicts;
}

/**
 * Local conflict radar: opposing always-on rules and mismatched commands.
 * Does not write or upload.
 */
export function findConflicts(rootInput: string): ConflictReport {
  const root = resolve(rootInput);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`yabgu: root is not a directory: ${root}`);
  }

  const docs = collectInstructionDocs(root, { includeSkills: false });
  const conflicts: ConflictHit[] = [];
  const notes: string[] = [];

  if (docs.length === 0) {
    notes.push("No instruction markdown found — nothing to compare.");
  }

  for (const topic of TOPICS) {
    const forbid = dedupeSides(findSides(docs, topic.forbid, "forbid"));
    const requireRaw = findSides(docs, topic.require, "require");
    // Drop "require" hits whose excerpt is itself a forbid line (e.g. "do not git push --force").
    const require = dedupeSides(
      requireRaw.filter(
        (r) =>
          !topic.forbid.some((re) => re.test(r.excerpt)) &&
          !/^(?:-\s*)?(?:do\s+not|don't|never)\b/i.test(r.excerpt),
      ),
    );
    if (forbid.length === 0 || require.length === 0) continue;

    conflicts.push({
      topic: topic.id,
      severity: topic.severity,
      summary: `Opposing rules about ${topic.label}`,
      sides: [...forbid.slice(0, 4), ...require.slice(0, 4)],
      tip: `Keep one polarity in AGENTS.md; delete or thin the duplicate in adapters so the model is not forced to choose.`,
    });
  }

  conflicts.push(...commandConflicts(docs));

  // Near-duplicate "do not" lines that differ slightly across files
  const doNotLines = new Map<string, Array<{ file: string; line: string }>>();
  for (const doc of docs) {
    for (const raw of doc.text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!/^(?:-\s*)?(?:do\s+not|don't|never)\b/i.test(line)) continue;
      if (line.length < 12 || line.length > 140) continue;
      const key = line
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
      // Group by first 4 significant words for fuzzy family
      const words = key.split(" ").slice(0, 5).join(" ");
      const group = doNotLines.get(words) ?? [];
      group.push({ file: doc.rel, line: line.slice(0, 140) });
      doNotLines.set(words, group);
    }
  }
  for (const [, group] of doNotLines) {
    const unique = [...new Set(group.map((g) => g.line.toLowerCase()))];
    const files = new Set(group.map((g) => g.file));
    if (unique.length < 2 || files.size < 2) continue;
    conflicts.push({
      topic: "near_duplicate_do_not",
      severity: "low",
      summary: "Near-duplicate “do not” rules that differ across files",
      sides: group.slice(0, 6).map((g) => ({
        polarity: "forbid" as const,
        file: g.file,
        excerpt: g.line,
      })),
      tip: "One shared do-not in AGENTS.md; adapters should @import or stay silent.",
    });
  }

  if (conflicts.length === 0 && docs.length > 0) {
    notes.push("No opposing topic pairs or mismatched commands detected (heuristic).");
  }
  notes.push(
    "Heuristic only — review excerpts; false positives possible. Prefer AGENTS.md as single source of truth.",
  );

  return {
    root,
    filesScanned: docs.map((d) => d.rel),
    conflicts,
    conflictCount: conflicts.length,
    notes,
  };
}

export function formatConflictReport(report: ConflictReport): string {
  const lines = [
    `# Yabgu conflicts — ${report.root}`,
    "",
    `Conflicts: **${report.conflictCount}** · Files scanned: ${report.filesScanned.length || "(none)"}`,
    "",
  ];
  if (report.filesScanned.length) {
    lines.push(`Scanned: ${report.filesScanned.map((f) => `\`${f}\``).join(", ")}`, "");
  }
  if (!report.conflicts.length) {
    lines.push("No conflicts found.", "");
  } else {
    for (const c of report.conflicts) {
      lines.push(`## [${c.severity}] ${c.summary}`, "");
      lines.push(`Topic: \`${c.topic}\``, "");
      for (const s of c.sides) {
        lines.push(`- (\`${s.polarity}\`) \`${s.file}\`: “${s.excerpt}”`);
      }
      lines.push("", `Tip: ${c.tip}`, "");
    }
  }
  if (report.notes.length) {
    lines.push("## Notes", "");
    for (const n of report.notes) lines.push(`- ${n}`);
    lines.push("");
  }
  return lines.join("\n");
}
