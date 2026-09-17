/**
 * Context-aware best-practice bullets for measure/scan/plan reports.
 * Sourced from docs/how-to-write.md + shared-source-of-truth.md — not a meta “what is this report” blurb.
 */

import type { HostHint, HostSession } from "./hosts.js";
import type { ScanResult } from "./scan.js";

export type PracticeContext = {
  score?: number;
  missingRootAgents: boolean;
  agentsLines?: number;
  nestedPaths: string[];
  workspaces: number;
  hasMakefile: boolean;
  makefileTargets: string[];
  toneHits?: number;
  session: HostSession;
  planHosts?: HostHint[];
};

function hostPractices(session: HostSession): string[] {
  switch (session.host) {
    case "cursor":
      return [
        "Cursor: one root `AGENTS.md` every session; add `.cursor/rules/*.mdc` only for real path globs — plain `.md` under rules is ignored.",
        "Host ≠ model: a Gemini/Claude model inside Cursor still does not load `GEMINI.md` / `CLAUDE.md`.",
      ];
    case "claude":
      return [
        "Claude Code: thin root `CLAUDE.md` with `@AGENTS.md`; keep shared rules in `AGENTS.md` (~200 lines).",
        "Multi-step runbooks belong in `.claude/skills/`, not always-on files.",
      ];
    case "gemini":
      return [
        "Gemini CLI: needs `GEMINI.md` (or `.gemini/settings.json` `context.fileName`). `@AGENTS.md` does not expand like Claude.",
        "Every line in `GEMINI.md` is attached every turn — prefer negative, checkable rules.",
      ];
    case "copilot":
      return [
        "Copilot: short `.github/copilot-instructions.md` that points at `AGENTS.md`; keep long shared text in one place.",
      ];
    case "codex":
      return [
        "Codex: root `AGENTS.md` is enough. Keep critical rules near the top (combined ceiling ~32 KiB).",
      ];
    case "grok":
      return [
        "Grok Build: root `AGENTS.md` + skills/hooks; do not duplicate the same rule set into other host files.",
      ];
    case "windsurf":
      return [
        "Windsurf/Cascade: root `AGENTS.md`; optional `.devin/rules` only if the team uses Cascade regularly.",
      ];
    default:
      return [
        "Unknown host: write root `AGENTS.md` first. Add other-host adapters only when that tool is actually used.",
      ];
  }
}

/** Best practices that apply to *this* scan/measure/plan state. */
export function bestPracticesFor(ctx: PracticeContext): string {
  const bullets: string[] = [];

  if (ctx.missingRootAgents) {
    bullets.push(
      "Put a short root `AGENTS.md` as the single source of truth (overview + copy-pasteable commands + concrete do-nots). Aim under ~200 lines.",
    );
  } else if (ctx.agentsLines != null && ctx.agentsLines > 200) {
    bullets.push(
      `Root AGENTS.md is ${ctx.agentsLines} lines — trim or move procedures to skills; long always-on files are followed less.`,
    );
  } else {
    bullets.push(
      "Keep root `AGENTS.md` short and checkable: full commands agents can run, bans over vague “write clean code”, deletion test on every line.",
    );
  }

  if (ctx.nestedPaths.length > 0) {
    bullets.push(
      `Nested package files (${ctx.nestedPaths.map((p) => `\`${p}\``).join(", ")}) stay package-scoped — they do not replace root AGENTS.md; do not copy them upward.`,
    );
  }

  if (ctx.workspaces > 1) {
    bullets.push(
      "Monorepo: list commands per workspace (`cd frontend && …`, `cd backend && go test ./…`). Do not invent a fake root package manager.",
    );
  }

  if (ctx.hasMakefile) {
    const sample =
      ctx.makefileTargets.length > 0
        ? ctx.makefileTargets.slice(0, 5).map((t) => `\`make ${t}\``).join(", ")
        : "`make` targets from the Makefile";
    bullets.push(`Prefer real Makefile entry points in Commands: ${sample}.`);
  }

  if ((ctx.toneHits ?? 0) > 0) {
    bullets.push(
      "Remove tone / “how to talk” rules from instruction files — out of scope for project context (wastes tokens, causes conflicts).",
    );
  }

  bullets.push(...hostPractices(ctx.session));

  const hosts = ctx.planHosts ?? [];
  if (hosts.length > 1) {
    bullets.push(
      `Planning for multiple hosts (${hosts.join(", ")}): adapters stay thin pointers — never paste the same long rule set into every file.`,
    );
  } else {
    bullets.push(
      "Do not create Copilot/Gemini/Claude adapter files unless that host was requested — extra files only add noise and conflicts.",
    );
  }

  const scoreLine =
    ctx.score != null ? `\n**Score now:** ${ctx.score}/100 (heuristic, not token savings).\n` : "\n";

  return [
    "## Best practices (for this repo now)",
    "",
    "Lead the user reply with these — not a meta description of the tool.",
    scoreLine,
    ...bullets.map((b) => `- ${b}`),
  ].join("\n");
}

export function practiceContextFromScan(
  scan: ScanResult,
  session: HostSession,
  extras?: Partial<PracticeContext>,
): PracticeContext {
  const agents = scan.instructionFiles.find((f) => f.path === "AGENTS.md");
  return {
    missingRootAgents: !agents?.exists || !!agents.empty,
    nestedPaths: scan.nestedInstructions.map((f) => f.path),
    workspaces: scan.workspaces.length,
    hasMakefile: scan.hasMakefile,
    makefileTargets: scan.makefileTargets,
    session,
    ...extras,
  };
}

/** How the host agent should rephrase these reports to the user. */
export const PRESENT_TO_USER = [
  "Present to the user in this order:",
  "1. The best-practice bullets above that apply right now (short; do not invent new ones).",
  "2. Session facts only (missing files, nested AGENTS, real commands from the scan).",
  "3. Propose only create/review items below — do not upsell Copilot/Gemini/Claude files unless those hosts were requested.",
  "4. Ask one clear approval question (e.g. write root AGENTS.md?) — not a multi-host menu.",
].join("\n");
