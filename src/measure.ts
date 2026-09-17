import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { collectInstructionDocs } from "./instruction-files.js";
import { classifyInstructionFiles, type HostSession } from "./hosts.js";
import { PRESENT_TO_USER, bestPracticesFor } from "./report.js";
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
export function measureRepo(
  rootInput: string,
  scan?: ScanResult,
  session?: HostSession,
): MeasureReport {
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
  for (const { rel, text } of collectInstructionDocs(root)) {
    for (const re of TONE_PATTERNS) {
      const m = text.match(re);
      if (m) toneRuleHits.push({ file: rel, match: m[0] });
    }
  }

  const missingRecommended: string[] = [];
  if (session) {
    const classified = classifyInstructionFiles(s.instructionFiles, session);
    missingRecommended.push(...classified.missingForSession);
  } else if (!hasAgentsMd || agentsEmpty) {
    missingRecommended.push("AGENTS.md");
  }

  const instructionFilesPresent = [
    ...s.instructionFiles,
    ...s.nestedInstructions,
  ]
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

export function formatMeasureReport(
  report: MeasureReport,
  session?: HostSession,
  scan?: ScanResult,
): string {
  const missingRoot = !report.hasAgentsMd || report.agentsEmpty;
  const nestedPaths = report.instructionFilesPresent.filter(
    (p) => p.includes("/") && /(^|\/)AGENTS\.md$/.test(p),
  );
  const practices = bestPracticesFor({
    score: report.score,
    missingRootAgents: missingRoot,
    agentsLines: report.hasAgentsMd && !report.agentsEmpty ? report.agentsLines : undefined,
    nestedPaths,
    workspaces: scan?.workspaces.length ?? 0,
    hasMakefile: scan?.hasMakefile ?? false,
    makefileTargets: scan?.makefileTargets ?? [],
    toneHits: report.toneRuleHits.length,
    session: session ?? { clientName: null, host: null, source: "unknown", loadsNote: "", modelNote: "" },
  });
  const lines = [
    `# Yabgu measure — ${report.root}`,
    "",
    practices,
    "",
    PRESENT_TO_USER,
    "",
    `| Check | Value |`,
    `| --- | --- |`,
    `| AGENTS.md | ${report.hasAgentsMd ? (report.agentsEmpty ? "empty" : `${report.agentsLines} lines`) : "missing"} |`,
    `| Adapters present | ${report.adapterFiles.length ? report.adapterFiles.join(", ") : "(none)"} |`,
    `| Nested / other present | ${report.instructionFilesPresent.filter((p) => p !== "AGENTS.md" && !report.adapterFiles.includes(p)).join(", ") || "(none)"} |`,
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
