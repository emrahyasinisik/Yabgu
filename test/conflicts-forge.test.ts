import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { findConflicts } from "../src/conflicts.js";
import { forgeSkill, forgeSkillFromText } from "../src/forge.js";

const FIX = join(fileURLToPath(new URL(".", import.meta.url)), "..", "fixtures");

describe("conflicts", () => {
  it("flags opposing push rules and mismatched test commands", () => {
    const report = findConflicts(join(FIX, "conflict-repo"));
    assert.ok(report.conflictCount >= 2, `expected >=2, got ${report.conflictCount}`);
    assert.ok(
      report.conflicts.some((c) => c.topic === "git_push"),
      "expected git_push",
    );
    assert.ok(
      report.conflicts.some((c) => c.topic === "command_test"),
      "expected command_test",
    );
    assert.ok(report.filesScanned.includes("AGENTS.md"));
    assert.ok(report.filesScanned.includes("CLAUDE.md"));
  });

  it("is quiet on a thin single-file fixture", () => {
    const report = findConflicts(join(FIX, "with-agents"));
    assert.equal(report.conflictCount, 0);
  });
});

describe("forge skill", () => {
  it("drafts SKILL.md from procedure text", () => {
    const draft = forgeSkillFromText({
      name: "cut-release",
      procedure: [
        "Cut a release when the user asks.",
        "1. Run tests",
        "2. Bump version",
        "3. Tag and publish",
        "4. Write release notes",
      ].join("\n"),
      host: "cursor",
    });
    assert.equal(draft.path, ".cursor/skills/cut-release/SKILL.md");
    assert.match(draft.content, /^---\nname: cut-release/m);
    assert.match(draft.content, /## Steps/);
    assert.match(draft.content, /Run tests/);
  });

  it("finds deploy runbook candidates in always-on AGENTS.md", () => {
    const report = forgeSkill({
      mode: "agents",
      root: join(FIX, "procedure-repo"),
    });
    assert.ok(report.candidates.length >= 1);
    assert.ok(
      report.candidates.some((c) => /deploy/i.test(c.heading)),
      "expected Deploy runbook candidate",
    );
    assert.ok(report.draft, "single strong candidate should auto-draft");
    assert.match(report.draft!.path, /\.cursor\/skills\/deploy-runbook\/SKILL\.md/);
  });

  it("mode=text via forgeSkill entry", () => {
    const report = forgeSkill({
      mode: "text",
      procedure:
        "1. Lock the branch\n2. Run the migration\n3. Verify health checks\n4. Unlock",
      name: "migrate-db",
      host: "claude",
    });
    assert.equal(report.draft?.path, ".claude/skills/migrate-db/SKILL.md");
  });
});
