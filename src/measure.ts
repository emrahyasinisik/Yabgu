import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { scanRepo, type ScanResult } from "./scan.js";

/** Heuristic phrases that look like tone / "how to talk" rules (out of scope for yabgu). */
export const TONE_PATTERNS: RegExp[] = [
  /\bbe\s+polite\b/i,
  /\bfriendly\s+tone\b/i,
  /\byou\s+should\s+speak\b/i,
  /\bhow\s+to\s+talk\b/i,
  /\bcommunication\s+style\b/i,
  /\balways\s+greet\b/i,
  /\buse\s+emoji\b/i,
  /\bhitap\b/i,
  /\bnezaket\b/i,
  /\bkonuşma\s+stili\b/i,
];

export type MeasureReport = {
  root: string;
  hasAgentsMd: boolean;
  agentsEmpty: boolean;
  agentsLines: number;
  adapterFiles: string[];
  toneRuleHits: Array<{ file: string; match: string }>;
  missingRecommended: string[];
  instructionFilesPresent: string[];
  /** 0–100; higher is healthier for agent instruction setup. */
  score: number;
  notes: string[];
};

function readIfFile(path: string): string | null {
  try {
    if (!existsSync(path) || !statSync(path).isFile()) return null;
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function collectMarkdownFiles(root: string): Array<{ rel: string; text: string }> {
  const out: Array<{ rel: string; text: string }> = [];
  const candidates = [
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    ".github/copilot-instructions.md",
  ];
  for (const rel of candidates) {
    const text = readIfFile(join(root, rel));
    if (text != null) out.push({ rel, text });
  }

  const ruleDirs = [".cursor/rules", ".claude/rules", ".windsurf/rules"];
  for (const dir of ruleDirs) {
    const abs = join(root, dir);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
    try {
      for (const name of readdirSync(abs)) {
        if (!/\.(md|mdc)$/i.test(name)) continue;
        const text = readIfFile(join(abs, name));
        if (text != null) out.push({ rel: `${dir}/${name}`, text });
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

function scoreFrom(report: Omit<MeasureReport, "score">): number {
  let score = 0;
  if (report.hasAgentsMd && !report.agentsEmpty) score += 40;
  if (report.agentsLines > 0 && report.agentsLines <= 200) score += 15;
  else if (report.agentsLines > 200) score += 5;
  score += Math.min(25, report.adapterFiles.length * 8);
  score -= Math.min(30, report.toneRuleHits.length * 10);
  score -= Math.min(20, report.missingRecommended.length * 5);
  return Math.max(0, Math.min(100, score));
}

/**
 * Local before/after health check for instruction files.
 * No network. Numbers are heuristics — do not publish as “token savings”.
 */
export function measureRepo(rootInput: string, scan?: ScanResult): MeasureReport {
  const root = resolve(rootInput);
  const s = scan ?? scanRepo(root);

  const agentsPath = join(root, "AGENTS.md");
  const agentsText = readIfFile(agentsPath);
  const hasAgentsMd = agentsText != null;
  const agentsEmpty = !agentsText || agentsText.trim().length === 0;
  const agentsLines = agentsText ? agentsText.split(/\r?\n/).length : 0;

  const adapterFiles: string[] = [];
  for (const f of s.instructionFiles) {
    if (!f.exists || f.empty) continue;
    if (f.path === "AGENTS.md") continue;
    adapterFiles.push(f.path);
  }

  const toneRuleHits: Array<{ file: string; match: string }> = [];
  for (const { rel, text } of collectMarkdownFiles(root)) {
    for (const re of TONE_PATTERNS) {
      const m = text.match(re);
      if (m) toneRuleHits.push({ file: rel, match: m[0] });
    }
  }

  const missingRecommended: string[] = [];
  if (!hasAgentsMd || agentsEmpty) missingRecommended.push("AGENTS.md");

  const instructionFilesPresent = s.instructionFiles
    .filter((f) => f.exists && !f.empty)
    .map((f) => f.path);

  const notes: string[] = [
    ...s.notes,
    "Score is a local heuristic for setup health — not a measured token savings figure.",
  ];

  const partial = {
    root,
    hasAgentsMd,
    agentsEmpty,
    agentsLines,
    adapterFiles,
    toneRuleHits,
    missingRecommended,
    instructionFilesPresent,
    notes,
  };

  return { ...partial, score: scoreFrom(partial) };
}

export function formatMeasureReport(report: MeasureReport): string {
  const lines = [
    `# Yabgu measure — ${report.root}`,
    "",
    `Score: **${report.score}/100** (heuristic; not token savings)`,
    "",
    `| Check | Value |`,
    `| --- | --- |`,
    `| AGENTS.md | ${report.hasAgentsMd ? (report.agentsEmpty ? "empty" : `${report.agentsLines} lines`) : "missing"} |`,
    `| Adapters present | ${report.adapterFiles.length ? report.adapterFiles.join(", ") : "(none)"} |`,
    `| Tone-rule hits | ${report.toneRuleHits.length} |`,
    `| Missing recommended | ${report.missingRecommended.length ? report.missingRecommended.join(", ") : "(none)"} |`,
    "",
  ];
  if (report.toneRuleHits.length) {
    lines.push("## Tone / communication hits (remove — out of scope)", "");
    for (const hit of report.toneRuleHits) {
      lines.push(`- \`${hit.file}\`: “${hit.match}”`);
    }
    lines.push("");
  }
  if (report.notes.length) {
    lines.push("## Notes", "");
    for (const n of report.notes) lines.push(`- ${n}`);
    lines.push("");
  }
  lines.push(
    "Before/after: run `yabgu measure <repo>` twice — once before setup, once after. Compare score, missing files, and tone hits.",
  );
  return lines.join("\n");
}
