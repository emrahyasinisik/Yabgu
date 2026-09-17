import type { TemplateId } from "./content.js";
import { readTemplate } from "./content.js";
import {
  defaultPlanHosts,
  planWarnings,
  resolveHostSession,
  type HostHint,
  type HostSession,
} from "./hosts.js";
import { PRESENT_TO_USER, bestPracticesFor, practiceContextFromScan } from "./report.js";
import type { ScanResult } from "./scan.js";

export type { HostHint, HostSession } from "./hosts.js";

export type ProposalAction = "create" | "skip" | "review";

export type FileProposal = {
  path: string;
  action: ProposalAction;
  reason: string;
  templateId: TemplateId | null;
  draft: string | null;
};

export type PlanResult = {
  root: string;
  hosts: HostHint[];
  session: HostSession;
  warnings: string[];
  proposals: FileProposal[];
  summary: string;
};

function statusOf(scan: ScanResult, path: string) {
  return scan.instructionFiles.find((f) => f.path === path);
}

function fillAgentsDraft(scan: ScanResult): string {
  const base = readTemplate("agents");
  const langs =
    scan.languages.length > 0
      ? scan.languages.join(", ")
      : "(fill: primary languages)";
  const frameworks =
    scan.frameworks.length > 0 ? ` / ${scan.frameworks.join(", ")}` : "";
  const ecosystems = scan.workspaces
    .map((w) => {
      const where = w.dir === "." ? "root" : w.dir;
      return `${where} ${w.ecosystem}`;
    })
    .filter((v, i, a) => a.indexOf(v) === i);
  const pmLine =
    ecosystems.length > 0
      ? ecosystems.join(", ")
      : scan.packageManager === "unknown"
        ? "(fill: package manager)"
        : scan.packageManager;

  const makeLines = scan.makefileTargets.map((t) => `make ${t}`);
  const goLines = scan.workspaces
    .filter((w) => w.ecosystem === "go")
    .flatMap((w) => {
      const prefix = w.dir === "." ? "" : `cd ${w.dir} && `;
      return [`${prefix}go test ./...`, `${prefix}go mod tidy`];
    });
  const pipLines = scan.workspaces
    .filter((w) => w.ecosystem === "pip")
    .map((w) => {
      const prefix = w.dir === "." ? "" : `cd ${w.dir} && `;
      return `${prefix}pip install -r requirements.txt`;
    });
  const nestedScripts = scan.workspaces.flatMap((w) => {
    if (w.dir === ".") return [];
    const prefix = `cd ${w.dir} && `;
    if (
      w.ecosystem === "npm" ||
      w.ecosystem === "pnpm" ||
      w.ecosystem === "yarn" ||
      w.ecosystem === "bun"
    ) {
      return Object.entries(w.scripts)
        .slice(0, 6)
        .map(([name, cmd]) => `${prefix}${w.ecosystem} run ${name}  # ${cmd}`);
    }
    return [];
  });
  const rootScripts = Object.entries(scan.scripts).map(
    ([name, cmd]) =>
      `${scan.packageManager === "unknown" ? "npm" : scan.packageManager} run ${name}  # ${cmd}`,
  );
  const fallbackMake =
    makeLines.length === 0 && scan.hasMakefile ? ["make  # see Makefile"] : [];
  const scriptLines = [
    ...makeLines,
    ...fallbackMake,
    ...goLines,
    ...pipLines,
    ...rootScripts,
    ...nestedScripts,
  ]
    .slice(0, 16)
    .join("\n");

  const covered = new Set(scan.workspaces.map((w) => w.dir).filter((d) => d !== "."));
  const workspaceLayout = scan.workspaces
    .filter((w) => w.dir !== ".")
    .map((w) => {
      const fw = w.frameworks.length ? `; ${w.frameworks.join(", ")}` : "";
      return `- \`${w.dir}/\` — ${w.ecosystem}${fw}`;
    });
  const extraLayout = scan.layout
    .filter((d) => !covered.has(d))
    .slice(0, 6)
    .map((d) => `- \`${d}/\` — (fill: what lives here)`);
  const layoutLines =
    [...workspaceLayout, ...extraLayout].join("\n") ||
    "- `src/` — (fill)";

  const nestedNote =
    scan.nestedInstructions.length > 0
      ? `\n- Nested package instructions already exist (${scan.nestedInstructions.map((f) => `\`${f.path}\``).join(", ")}). Keep them package-scoped; do not duplicate into root.`
      : "";

  const overviewBody = scan.readmeBlurb
    ? scan.readmeBlurb
    : "(fill from README / code — 2–4 sentences a new teammate would miss)";
  const overview = [
    `- What this repo is: ${overviewBody}${nestedNote}`,
    `- Primary languages / frameworks / package manager: ${langs}${frameworks}; package manager **${pmLine}**`,
  ].join("\n");

  const commands = scriptLines
    ? ["```bash", scriptLines, "```"].join("\n")
    : ["```bash", `# install`, `# test`, `# lint`, "```"].join("\n");

  return base
    .replace(
      /- What this repo is[\s\S]*?- Primary languages[^\n]*/,
      overview,
    )
    .replace(/```bash[\s\S]*?```/, commands)
    .replace(
      /- `src\/` —\n- `tests\/` —/,
      layoutLines,
    );
}

function agentsCreateReason(scan: ScanResult): string {
  if (scan.nestedInstructions.length > 0) {
    return (
      `Root AGENTS.md missing. Nested ${scan.nestedInstructions.map((f) => f.path).join(", ")} ` +
      "only apply under those packages — agents at repo root still need a shared root file. " +
      "Keep nested files; do not copy their contents into root."
    );
  }
  return "Shared source of truth for this host. Missing or empty at repo root.";
}

function fillClaudeDraft(): string {
  return readTemplate("claude");
}

function fillGeminiDraft(): string {
  return readTemplate("gemini");
}

function fillCopilotDraft(): string {
  return readTemplate("copilot-instructions");
}

/**
 * Build a justified file plan from a local scan.
 * Does not write anything.
 * Omit hosts to plan for this MCP session only — not every adapter in the catalog.
 */
export function planFromScan(
  scan: ScanResult,
  hostsInput?: HostHint[],
  sessionInput?: HostSession,
): PlanResult {
  const session = sessionInput ?? resolveHostSession();
  const hosts = defaultPlanHosts(session, hostsInput);
  const proposals: FileProposal[] = [];

  const agents = statusOf(scan, "AGENTS.md");
  if (!agents?.exists || agents.empty) {
    proposals.push({
      path: "AGENTS.md",
      action: "create",
      reason: agentsCreateReason(scan),
      templateId: "agents",
      draft: fillAgentsDraft(scan),
    });
  } else {
    proposals.push({
      path: "AGENTS.md",
      action: "skip",
      reason: "Non-empty AGENTS.md already present — do not overwrite.",
      templateId: null,
      draft: null,
    });
  }

  if (hosts.includes("claude")) {
    const claude = statusOf(scan, "CLAUDE.md");
    if (!claude?.exists || claude.empty) {
      proposals.push({
        path: "CLAUDE.md",
        action: "create",
        reason:
          "Claude Code does not load AGENTS.md directly; thin adapter with @AGENTS.md.",
        templateId: "claude",
        draft: fillClaudeDraft(),
      });
    } else {
      proposals.push({
        path: "CLAUDE.md",
        action: "skip",
        reason: "Non-empty CLAUDE.md already present.",
        templateId: null,
        draft: null,
      });
    }
  }

  if (hosts.includes("gemini")) {
    const gemini = statusOf(scan, "GEMINI.md");
    if (!gemini?.exists || gemini.empty) {
      proposals.push({
        path: "GEMINI.md",
        action: "create",
        reason: "Gemini CLI loads GEMINI.md; keep it a thin pointer to shared rules.",
        templateId: "gemini",
        draft: fillGeminiDraft(),
      });
    } else {
      proposals.push({
        path: "GEMINI.md",
        action: "skip",
        reason: "Non-empty GEMINI.md already present.",
        templateId: null,
        draft: null,
      });
    }
    const settings = statusOf(scan, ".gemini/settings.json");
    if (!settings?.exists || settings.empty) {
      proposals.push({
        path: ".gemini/settings.json",
        action: "review",
        reason:
          "Optional: set context.fileName to load AGENTS.md + GEMINI.md without duplicating rules. Template: gemini-settings.",
        templateId: "gemini-settings",
        draft: null,
      });
    }
  }

  if (hosts.includes("copilot")) {
    const copilot = statusOf(scan, ".github/copilot-instructions.md");
    if (!copilot?.exists || copilot.empty) {
      proposals.push({
        path: ".github/copilot-instructions.md",
        action: "create",
        reason:
          "Copilot Chat/review reads .github/copilot-instructions.md; keep short and point at AGENTS.md.",
        templateId: "copilot-instructions",
        draft: fillCopilotDraft(),
      });
    } else {
      proposals.push({
        path: ".github/copilot-instructions.md",
        action: "skip",
        reason: "Non-empty Copilot instructions already present.",
        templateId: null,
        draft: null,
      });
    }
  }

  if (hosts.includes("cursor")) {
    const rules = statusOf(scan, ".cursor/rules");
    if (!rules?.exists || rules.empty) {
      proposals.push({
        path: ".cursor/rules/",
        action: "review",
        reason:
          "Optional only. Skip unless you have a real path-scoped convention (e.g. `frontend/**/*.ts`). Root AGENTS.md is enough for shared rules — do not invent .mdc files.",
        templateId: "cursor-glob",
        draft: null,
      });
    }
  }

  if (hosts.includes("windsurf")) {
    const devin = statusOf(scan, ".devin/rules");
    const wind = statusOf(scan, ".windsurf/rules");
    const hasRules =
      (devin?.exists && !devin.empty) || (wind?.exists && !wind.empty);
    if (!hasRules) {
      proposals.push({
        path: ".devin/rules/",
        action: "review",
        reason:
          "Cascade/Windsurf rules are optional (.devin/rules preferred; .windsurf/rules is legacy). Add only if the team uses Cascade regularly.",
        templateId: "windsurf-style",
        draft: null,
      });
    }
  }

  const toCreate = proposals.filter((p) => p.action === "create").length;
  const present = [
    ...scan.instructionFiles,
    ...scan.nestedInstructions,
  ]
    .filter((f) => f.exists && !f.empty)
    .map((f) => f.path);
  const warnings = planWarnings(session, hosts, present);
  const hostLabel = hosts.length > 0 ? hosts.join(", ") : "AGENTS.md only (host undetected)";
  const summary =
    toCreate === 0
      ? `No mandatory files missing for ${hostLabel}. Review optional items only.`
      : `Propose ${toCreate} file(s) for ${hostLabel}. Show each draft; do not add other-host adapters unless asked. Call yabgu_apply only after explicit approval (confirmed=true).`;

  return { root: scan.root, hosts, session, warnings, proposals, summary };
}

export function formatPlanReport(plan: PlanResult, scan?: ScanResult): string {
  const practices = scan
    ? bestPracticesFor(
        practiceContextFromScan(scan, plan.session, { planHosts: plan.hosts }),
      )
    : bestPracticesFor({
        missingRootAgents: plan.proposals.some(
          (p) => p.path === "AGENTS.md" && p.action === "create",
        ),
        nestedPaths: [],
        workspaces: 0,
        hasMakefile: false,
        makefileTargets: [],
        session: plan.session,
        planHosts: plan.hosts,
      });
  const lines = [
    `# Yabgu plan — ${plan.root}`,
    "",
    practices,
    "",
    PRESENT_TO_USER,
    "",
    plan.summary,
    "",
    `Hosts: ${plan.hosts.length ? plan.hosts.join(", ") : "(AGENTS.md only)"}`,
    `Session: ${plan.session.host ?? "unknown"} (${plan.session.source})`,
    "",
    "## Warnings (show the user)",
    "",
    ...plan.warnings.map((w) => `- ${w}`),
    "",
    "## Proposals",
    "",
  ];
  for (const p of plan.proposals) {
    lines.push(`- **${p.action}** \`${p.path}\` — ${p.reason}`);
  }
  lines.push(
    "",
    "Show each create draft (commands should already be filled from the scan). Do not write until the user approves.",
    "Do not offer Copilot/Gemini/Claude adapters unless those hosts appear above.",
  );
  return lines.join("\n");
}
