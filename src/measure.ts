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

/**
 * Lines that ban / exclude tone rules — not instructions to speak a certain way.
 * "Do not add how to talk rules" must not count as a tone hit.
 */
export function isToneBanLine(line: string): boolean {
  return (
    /\bdo\s+not\b/i.test(line) ||
    /\bdon't\b/i.test(line) ||
    /\bout\s+of\s+scope\b/i.test(line) ||
    /\b(omit|remove|avoid)\b[\s\S]{0,60}\b(tone|communication|how\s+to\s+talk|voice|emoji)\b/i.test(
      line,
    ) ||
    /\bno\s+(tone|communication|voice)\b/i.test(line)
  );
}

/** Scan one file for positive tone-rule phrases (skips ban lines). */
export function collectToneHits(
  rel: string,
  text: string,
): Array<{ file: string; match: string }> {
  const hits: Array<{ file: string; match: string }> = [];
  for (const line of text.split(/\r?\n/)) {
    if (isToneBanLine(line)) continue;
    for (const re of TONE_PATTERNS) {
      const m = line.match(re);
      if (m) hits.push({ file: rel, match: m[0] });
    }
  }
  return hits;
}

export type ScoreBreakdown = {
  agentsPresent: number;
  agentsLines: number;
  sessionAdapters: number;
  tonePenalty: number;
  missingPenalty: number;
};

export type MeasureReport = {
  root: string;
  hasAgentsMd: boolean;
  agentsEmpty: boolean;
  agentsLines: number;
  /** All non-AGENTS instruction files present (informational). */
  adapterFiles: string[];
  /** Session-native adapters only (excludes AGENTS.md); empty when host unknown. */
  sessionAdapterFiles: string[];
  toneRuleHits: Array<{ file: string; match: string }>;
  missingRecommended: string[];
  instructionFilesPresent: string[];
  /** 0–100; higher is healthier for agent instruction setup. */
  score: number;
  scoreBreakdown: ScoreBreakdown;
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

function scoreFrom(report: Omit<MeasureReport, "score" | "scoreBreakdown">): {
  score: number;
  scoreBreakdown: ScoreBreakdown;
} {
  const agentsPresent = report.hasAgentsMd && !report.agentsEmpty ? 50 : 0;
  let agentsLines = 0;
  if (report.agentsLines > 0 && report.agentsLines <= 200) agentsLines = 25;
  else if (report.agentsLines > 200) agentsLines = 8;
  // Only session-native adapters count — other-host files do not inflate health.
  const sessionAdapters = Math.min(25, report.sessionAdapterFiles.length * 10);
  const tonePenalty = -Math.min(30, report.toneRuleHits.length * 10);
  const missingPenalty = -Math.min(20, report.missingRecommended.length * 5);
  const scoreBreakdown: ScoreBreakdown = {
    agentsPresent,
    agentsLines,
    sessionAdapters,
    tonePenalty,
    missingPenalty,
  };
  const raw =
    agentsPresent + agentsLines + sessionAdapters + tonePenalty + missingPenalty;
  return { score: Math.max(0, Math.min(100, raw)), scoreBreakdown };
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
    toneRuleHits.push(...collectToneHits(rel, text));
  }

  const missingRecommended: string[] = [];
  let sessionAdapterFiles: string[] = [];
  if (session) {
    const classified = classifyInstructionFiles(s.instructionFiles, session);
    missingRecommended.push(...classified.missingForSession);
    sessionAdapterFiles = classified.presentForSession.filter((p) => p !== "AGENTS.md");
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
  if (!session?.host && adapterFiles.length > 0) {
    notes.push(
      "Other-host adapters present but session host is unknown — they do not add to the score (pass the MCP session to score session-native files only).",
    );
  }

  const partial = {
    root,
    hasAgentsMd,
    agentsEmpty,
    agentsLines,
    adapterFiles,
    sessionAdapterFiles,
    toneRuleHits,
    missingRecommended,
    instructionFilesPresent,
    notes,
  };

  const { score, scoreBreakdown } = scoreFrom(partial);
  return { ...partial, score, scoreBreakdown };
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
    `| Session adapters (scored) | ${report.sessionAdapterFiles.length ? report.sessionAdapterFiles.join(", ") : "(none — need session host, or AGENTS-only is enough)"} |`,
    `| Nested / other present | ${report.instructionFilesPresent.filter((p) => p !== "AGENTS.md" && !report.adapterFiles.includes(p)).join(", ") || "(none)"} |`,
    `| Tone-rule hits | ${report.toneRuleHits.length} |`,
    `| Missing recommended | ${report.missingRecommended.length ? report.missingRecommended.join(", ") : "(none)"} |`,
    "",
    "## Score breakdown",
    "",
    `| Component | Points |`,
    `| --- | --- |`,
    `| AGENTS.md present | ${report.scoreBreakdown.agentsPresent} |`,
    `| Line count | ${report.scoreBreakdown.agentsLines} |`,
    `| Session adapters | ${report.scoreBreakdown.sessionAdapters} |`,
    `| Tone penalty | ${report.scoreBreakdown.tonePenalty} |`,
    `| Missing penalty | ${report.scoreBreakdown.missingPenalty} |`,
    `| **Total** | **${report.score}** |`,
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
