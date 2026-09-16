/**
 * Real-test helper: measure → plan → apply approved drafts → measure.
 * Run from package root: npm run example:setup
 */
import { resolve } from "node:path";
import { applyFiles } from "../src/apply.js";
import { formatMeasureReport, measureRepo } from "../src/measure.js";
import { planFromScan } from "../src/plan.js";
import { scanRepo } from "../src/scan.js";

const root = resolve("examples/test-project");

const before = measureRepo(root);
console.log("=== BEFORE ===");
console.log(formatMeasureReport(before));

const scan = scanRepo(root);
const plan = planFromScan(scan, ["cursor", "claude", "copilot", "codex"]);
console.log("\n=== PLAN ===");
console.log(plan.summary);
for (const p of plan.proposals) {
  console.log(`- ${p.action}: ${p.path} — ${p.reason}`);
}

const files = plan.proposals
  .filter((p) => p.action === "create" && p.draft)
  .map((p) => ({ path: p.path, content: p.draft as string }));

if (files.length === 0) {
  console.log("\nNothing to apply (already set up?). Run: npm run example:reset");
  process.exit(0);
}

const result = applyFiles(root, files, { confirmed: true });
console.log("\n=== APPLY ===");
console.log(JSON.stringify(result, null, 2));

const after = measureRepo(root);
console.log("\n=== AFTER ===");
console.log(formatMeasureReport(after));

if (after.score <= before.score) {
  console.error(
    `\nFAIL: after score (${after.score}) should be > before (${before.score})`,
  );
  process.exit(1);
}
if (after.toneRuleHits.length > 0) {
  console.error("\nFAIL: tone-rule hits after setup");
  process.exit(1);
}
if (!after.hasAgentsMd || after.agentsEmpty) {
  console.error("\nFAIL: AGENTS.md missing or empty after setup");
  process.exit(1);
}

console.log(
  `\nPASS: score ${before.score} → ${after.score}; tone hits ${after.toneRuleHits.length}`,
);
