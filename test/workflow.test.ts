import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { applyFiles, isAllowedInstructionPath } from "../src/apply.js";
import { measureRepo } from "../src/measure.js";
import { planFromScan } from "../src/plan.js";
import { resolveProjectRoot } from "../src/root.js";
import { scanRepo } from "../src/scan.js";

const FIX = join(fileURLToPath(new URL(".", import.meta.url)), "..", "fixtures");

describe("scan / plan / apply", () => {
  it("scans bare fixture and proposes AGENTS.md", () => {
    const scan = scanRepo(join(FIX, "bare-repo"));
    assert.equal(scan.packageManager, "npm");
    assert.ok(scan.languages.includes("TypeScript"));
    assert.ok(scan.frameworks.includes("Express"));
    const plan = planFromScan(scan, ["cursor", "claude", "copilot"]);
    const create = plan.proposals.filter((p) => p.action === "create");
    assert.ok(create.some((p) => p.path === "AGENTS.md" && p.draft));
    assert.ok(create.some((p) => p.path === "CLAUDE.md"));
    assert.ok(create.some((p) => p.path === ".github/copilot-instructions.md"));
  });

  it("skips existing non-empty AGENTS.md", () => {
    const scan = scanRepo(join(FIX, "with-agents"));
    const plan = planFromScan(scan);
    const agents = plan.proposals.find((p) => p.path === "AGENTS.md");
    assert.equal(agents?.action, "skip");
  });

  it("refuses apply without confirmed=true", () => {
    assert.throws(
      () =>
        applyFiles(join(FIX, "bare-repo"), [{ path: "AGENTS.md", content: "x" }], {
          confirmed: false,
        }),
      /confirmed=true/,
    );
  });

  it("writes then skips overwrite of non-empty", () => {
    const dir = mkdtempSync(join(tmpdir(), "yabgu-apply-"));
    try {
      const first = applyFiles(
        dir,
        [{ path: "AGENTS.md", content: "# one\n" }],
        { confirmed: true },
      );
      assert.deepEqual(first.written, ["AGENTS.md"]);
      assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), "# one\n");

      const second = applyFiles(
        dir,
        [{ path: "AGENTS.md", content: "# two\n" }],
        { confirmed: true },
      );
      assert.deepEqual(second.written, []);
      assert.equal(second.skipped[0]?.reason.includes("non-empty"), true);
      assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), "# one\n");

      const third = applyFiles(
        dir,
        [{ path: "AGENTS.md", content: "# two\n" }],
        { confirmed: true, overwrite: true },
      );
      assert.deepEqual(third.written, ["AGENTS.md"]);
      assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), "# two\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("blocks path escape", () => {
    const dir = mkdtempSync(join(tmpdir(), "yabgu-escape-"));
    try {
      writeFileSync(join(dir, "safe.txt"), "ok");
      assert.throws(
        () =>
          applyFiles(
            dir,
            [{ path: "../outside.md", content: "nope" }],
            { confirmed: true },
          ),
        /\.\./,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips non-instruction paths and oversize content", () => {
    assert.equal(isAllowedInstructionPath("AGENTS.md"), true);
    assert.equal(isAllowedInstructionPath(".cursor/rules/ts.mdc"), true);
    assert.equal(isAllowedInstructionPath("src/index.ts"), false);

    const dir = mkdtempSync(join(tmpdir(), "yabgu-allow-"));
    try {
      const result = applyFiles(
        dir,
        [
          { path: "src/index.ts", content: "export {}\n" },
          { path: "package.json", content: "{}\n" },
        ],
        { confirmed: true },
      );
      assert.deepEqual(result.written, []);
      assert.equal(result.skipped.length, 2);

      const huge = applyFiles(
        dir,
        [{ path: "AGENTS.md", content: "x".repeat(33 * 1024) }],
        { confirmed: true },
      );
      assert.equal(huge.written.length, 0);
      assert.match(huge.skipped[0]?.reason ?? "", /exceeds/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a root outside advertised MCP roots", () => {
    const inside = join(FIX, "bare-repo");
    const outside = join(FIX, "with-agents");
    assert.throws(
      () => resolveProjectRoot(outside, [inside]),
      /outside host workspace/,
    );
    assert.equal(resolveProjectRoot(inside, [inside]), resolveProjectRoot(inside));
  });
});

describe("measure", () => {
  it("scores with-agents higher than bare and flags tone-heavy", () => {
    const bare = measureRepo(join(FIX, "bare-repo"));
    const ok = measureRepo(join(FIX, "with-agents"));
    const tone = measureRepo(join(FIX, "tone-heavy"));
    assert.ok(ok.score > bare.score);
    assert.ok(tone.toneRuleHits.length >= 2);
    assert.ok(tone.score < ok.score);
  });
});
