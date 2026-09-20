#!/usr/bin/env node

import { findConflicts, formatConflictReport } from "./conflicts.js";
import { forgeSkill } from "./forge.js";
import { formatMeasureReport, measureRepo } from "./measure.js";
import { startMcp } from "./mcp.js";
import {
  hostSetupSnippet,
  isSetupHostId,
  SETUP_HOST_IDS,
  writeHostSetup,
} from "./setup.js";

function printHelp(): void {
  console.log(`yabgu — short instruction files for coding agents

Usage:
  yabgu mcp                      Start the MCP server on stdio
  yabgu setup <host>             Print MCP install snippet for a host
  yabgu setup <host> --write     Write project MCP config (see below)
  yabgu measure <path>           Local setup-health score (before/after)
  yabgu conflicts <path>         Opposing rules / mismatched commands
  yabgu forge <path>             Find skill candidates in always-on files
  yabgu help                     Show this message

Hosts: ${SETUP_HOST_IDS.join(", ")}

--write paths (cwd = project root):
  cursor   → .cursor/mcp.json
  copilot  → .vscode/mcp.json
  codex    → .codex/config.toml
  grok     → .grok/config.toml
  gemini   → .gemini/settings.json
  opencode → opencode.json
  claude   → prints \`claude mcp add …\` (no file)

Non-empty configs are not overwritten unless you pass --overwrite.

Before MCP is connected: use this CLI or the README JSON blocks.
After connect: MCP tool yabgu_host_setup, prompt yabgu_setup.

MCP tools: get_started, template, host_guide, host_setup, scan, plan, apply, measure, conflicts, forge_skill
Resources: yabgu://template/{id}, yabgu://host/{id}, yabgu://doc/{writing|matrix|shared}
Prompt: yabgu_setup

Privacy: local stdio only; scan/measure/apply never send repo data to a yabgu server.

More info: https://github.com/emrahyasinisik/Yabgu
Site: https://emrahyasinisik.github.io/Yabgu/
`);
}

function runSetup(argv: string[]): void {
  const hostArg = argv[0];
  if (!hostArg || hostArg.startsWith("-")) {
    console.error(
      `Usage: yabgu setup <host> [--write] [--overwrite]\nHosts: ${SETUP_HOST_IDS.join(", ")}`,
    );
    process.exit(1);
  }
  if (!isSetupHostId(hostArg)) {
    console.error(`Unknown host: ${hostArg}\nHosts: ${SETUP_HOST_IDS.join(", ")}`);
    process.exit(1);
  }

  const write = argv.includes("--write");
  const overwrite = argv.includes("--overwrite");

  if (!write) {
    console.log(hostSetupSnippet(hostArg));
    return;
  }

  const result = writeHostSetup(process.cwd(), hostArg, { overwrite });
  if (!result.ok) {
    if (result.reason === "print_only") {
      console.log(result.message);
      return;
    }
    console.error(result.message);
    process.exit(1);
  }
  console.log(`Wrote ${result.path}`);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];

  if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
    printHelp();
    return;
  }

  if (cmd === "mcp") {
    await startMcp();
    return;
  }

  if (cmd === "setup") {
    runSetup(process.argv.slice(3));
    return;
  }

  if (cmd === "measure") {
    const root = process.argv[3];
    if (!root) {
      console.error("Usage: yabgu measure <path>");
      process.exit(1);
    }
    const report = measureRepo(root);
    console.log(formatMeasureReport(report));
    return;
  }

  if (cmd === "conflicts") {
    const root = process.argv[3];
    if (!root) {
      console.error("Usage: yabgu conflicts <path>");
      process.exit(1);
    }
    const report = findConflicts(root);
    console.log(formatConflictReport(report));
    return;
  }

  if (cmd === "forge") {
    const root = process.argv[3];
    if (!root) {
      console.error(
        "Usage: yabgu forge <path>  # scan always-on files for skill candidates",
      );
      process.exit(1);
    }
    const report = forgeSkill({ mode: "agents", root });
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.error(`Unknown command: ${cmd}\n`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
