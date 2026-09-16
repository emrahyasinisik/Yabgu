#!/usr/bin/env node

import { formatMeasureReport, measureRepo } from "./measure.js";
import { startMcp } from "./mcp.js";

function printHelp(): void {
  console.log(`yabgu — short instruction files for coding agents

Usage:
  yabgu mcp              Start the MCP server on stdio
  yabgu measure <path>   Local setup-health score (before/after)
  yabgu help             Show this message

MCP tools: get_started, template, host_guide, host_setup, scan, plan, apply, measure
Resources: yabgu://template/{id}, yabgu://host/{id}, yabgu://doc/{writing|matrix|shared}
Prompt: yabgu_setup

Install snippets differ by host — call yabgu_host_setup or see docs/hosts.md.

Privacy: local stdio only; scan/measure/apply never send repo data to a yabgu server.

More info: https://github.com/emrahyasinisik/yabgu
`);
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

  console.error(`Unknown command: ${cmd}\n`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
