import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  hostSetupSnippet,
  hostSetupWriteTarget,
  isSetupHostId,
  writeHostSetup,
} from "../src/setup.js";

describe("yabgu setup", () => {
  it("recognizes setup host ids", () => {
    assert.equal(isSetupHostId("cursor"), true);
    assert.equal(isSetupHostId("nope"), false);
  });

  it("prints a Cursor snippet with npx package", () => {
    const text = hostSetupSnippet("cursor");
    assert.match(text, /\.cursor\/mcp\.json/);
    assert.match(text, /@emrahyasinisik\/yabgu/);
  });

  it("writes Cursor mcp.json and refuses overwrite without flag", () => {
    const root = mkdtempSync(join(tmpdir(), "yabgu-setup-"));
    try {
      const first = writeHostSetup(root, "cursor");
      assert.equal(first.ok, true);
      if (!first.ok) return;
      const path = join(root, ".cursor/mcp.json");
      assert.equal(first.path, path);
      const body = readFileSync(path, "utf8");
      assert.match(body, /"mcpServers"/);
      assert.match(body, /@emrahyasinisik\/yabgu/);

      const blocked = writeHostSetup(root, "cursor");
      assert.equal(blocked.ok, false);
      if (blocked.ok) return;
      assert.equal(blocked.reason, "exists");

      const forced = writeHostSetup(root, "cursor", { overwrite: true });
      assert.equal(forced.ok, true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("claude --write is print-only", () => {
    const root = mkdtempSync(join(tmpdir(), "yabgu-setup-claude-"));
    try {
      const result = writeHostSetup(root, "claude");
      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.reason, "print_only");
      assert.match(result.message, /claude mcp add/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("allows write when existing file is empty", () => {
    const root = mkdtempSync(join(tmpdir(), "yabgu-setup-empty-"));
    try {
      mkdirSync(join(root, ".cursor"), { recursive: true });
      writeFileSync(join(root, ".cursor/mcp.json"), "   \n", "utf8");
      const result = writeHostSetup(root, "cursor");
      assert.equal(result.ok, true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("exposes write targets for common hosts", () => {
    assert.equal(hostSetupWriteTarget("cursor")?.relativePath, ".cursor/mcp.json");
    assert.equal(hostSetupWriteTarget("copilot")?.relativePath, ".vscode/mcp.json");
    assert.equal(hostSetupWriteTarget("windsurf"), null);
  });
});
