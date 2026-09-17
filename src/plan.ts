import type { TemplateId } from "./content.js";
import { readTemplate } from "./content.js";
import type { ScanResult } from "./scan.js";

export type HostHint =
  | "cursor"
  | "claude"
  | "codex"
  | "copilot"
  | "gemini"
  | "windsurf"
  | "grok";

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
  proposals: FileProposal[];
  summary: string;
};

const DEFAULT_HOSTS: HostHint[] = ["cursor", "codex", "copilot", "grok"];

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
  const pm = scan.packageManager === "unknown" ? "npm" : scan.packageManager;

  const scriptLines = Object.entries(scan.scripts)
    .slice(0, 12)
    .map(([name, cmd]) => `${pm} run ${name}  # ${cmd}`)
    .join("\n");

  const layoutLines =
    scan.layout.length > 0
      ? scan.layout
          .slice(0, 8)
          .map((d) => `- \`${d}/\` — (fill: what lives here)`)
          .join("\n")
      : "- `src/` — (fill)";

  const overview = [
    `- What this repo is (2–4 sentences, including decisions a new teammate would miss): (fill from README / code)`,
    `- Primary languages / frameworks / package manager: ${langs}${frameworks}; package manager **${pm}**`,
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
 */
export function planFromScan(
  scan: ScanResult,
  hostsInput?: HostHint[],
): PlanResult {
  const hosts = hostsInput && hostsInput.length > 0 ? hostsInput : DEFAULT_HOSTS;
  const proposals: FileProposal[] = [];

  const agents = statusOf(scan, "AGENTS.md");
  if (!agents?.exists || agents.empty) {
    proposals.push({
      path: "AGENTS.md",
      action: "create",
      reason:
        "Shared source of truth for Cursor, Codex, Copilot, and Grok. Missing or empty.",
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
          "Cursor glob/always rules are optional. Add .mdc only for real path-scoped conventions — use yabgu_template cursor-glob / cursor-always.",
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
  const summary =
    toCreate === 0
      ? "No mandatory files missing for the selected hosts. Review optional items only."
      : `Propose ${toCreate} file(s) for creation. Show each draft to the user; call yabgu_apply only after explicit approval (confirmed=true).`;

  return { root: scan.root, hosts, proposals, summary };
}
