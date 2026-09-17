import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ElicitRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "node:url";
import {
  MAX_INSTRUCTIONS_BYTES,
  MAX_INSTRUCTIONS_LEAD_CHARS,
  SERVER_INSTRUCTIONS,
  createServer,
} from "../src/mcp.js";
import { isReadOnlyFromEnv } from "../src/policy.js";

const BARE = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "fixtures",
  "bare-repo",
);

async function connectClient(opts?: {
  readOnly?: boolean;
  elicitation?: boolean;
  elicitAction?: "accept" | "decline" | "cancel";
  elicitApprove?: boolean;
}) {
  const server = createServer({ readOnly: opts?.readOnly });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client(
    { name: "yabgu-test", version: "0.0.0" },
    opts?.elicitation
      ? { capabilities: { elicitation: { form: {} } } }
      : undefined,
  );

  if (opts?.elicitation) {
    client.setRequestHandler(ElicitRequestSchema, async () => ({
      action: opts.elicitAction ?? "accept",
      content:
        (opts.elicitAction ?? "accept") === "accept"
          ? { approve: opts.elicitApprove !== false }
          : undefined,
    }));
  }

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

describe("MCP harness", () => {
  it("keeps server instructions under Claude's ~2 KB truncate limit", () => {
    const bytes = Buffer.byteLength(SERVER_INSTRUCTIONS, "utf8");
    assert.ok(
      bytes <= MAX_INSTRUCTIONS_BYTES,
      `instructions ${bytes} bytes exceed ${MAX_INSTRUCTIONS_BYTES}`,
    );
  });

  it("keeps the first 512 characters self-contained for Codex", () => {
    const lead = SERVER_INSTRUCTIONS.slice(0, MAX_INSTRUCTIONS_LEAD_CHARS);
    assert.match(lead, /Search Yabgu/);
    assert.match(lead, /AGENTS\.md/);
    assert.match(lead, /yabgu_scan/);
    assert.match(lead, /yabgu_apply/);
  });

  it("lists tools with readOnlyHint on readers and not on apply", async () => {
    const { client, close } = await connectClient();
    try {
      const { tools } = await client.listTools();
      const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
      for (const name of [
        "yabgu_get_started",
        "yabgu_template",
        "yabgu_host_guide",
        "yabgu_host_setup",
        "yabgu_scan",
        "yabgu_plan",
        "yabgu_measure",
        "yabgu_conflicts",
        "yabgu_forge_skill",
      ]) {
        assert.equal(byName[name]?.annotations?.readOnlyHint, true, name);
      }
      assert.equal(byName.yabgu_apply?.annotations?.readOnlyHint, false);
      assert.equal(byName.yabgu_apply?.annotations?.destructiveHint, true);
    } finally {
      await close();
    }
  });

  it("hides yabgu_apply when readOnly / YABGU_READ_ONLY", async () => {
    assert.equal(isReadOnlyFromEnv({ YABGU_READ_ONLY: "1" }), true);
    assert.equal(isReadOnlyFromEnv({ YABGU_READ_ONLY: "true" }), true);
    assert.equal(isReadOnlyFromEnv({}), false);

    const { client, close } = await connectClient({ readOnly: true });
    try {
      const { tools } = await client.listTools();
      assert.equal(
        tools.some((t) => t.name === "yabgu_apply"),
        false,
      );
      assert.ok(tools.some((t) => t.name === "yabgu_scan"));
    } finally {
      await close();
    }
  });

  it("exposes templates as resources and setup prompt", async () => {
    const { client, close } = await connectClient();
    try {
      const { resources } = await client.listResources();
      assert.ok(resources.some((r) => r.uri === "yabgu://template/agents"));
      const read = await client.readResource({ uri: "yabgu://template/agents" });
      const text = String(read.contents[0] && "text" in read.contents[0] ? read.contents[0].text : "");
      assert.ok(text.includes("Project instructions") || text.length > 20);

      const { prompts } = await client.listPrompts();
      assert.ok(prompts.some((p) => p.name === "yabgu_setup"));
    } finally {
      await close();
    }
  });

  it("scan → plan → apply(confirmed) on a temp copy path works via tools", async () => {
    const { client, close } = await connectClient();
    try {
      const scanned = await client.callTool({
        name: "yabgu_scan",
        arguments: { root: BARE },
      });
      assert.notEqual(scanned.isError, true);

      const planned = await client.callTool({
        name: "yabgu_plan",
        arguments: { root: BARE, hosts: ["cursor"] },
      });
      assert.notEqual(planned.isError, true);
      const planText = String(
        (planned.content as Array<{ text?: string }>)[0]?.text ?? "",
      );
      assert.match(planText, /AGENTS\.md/);

      const refused = await client.callTool({
        name: "yabgu_apply",
        arguments: {
          root: BARE,
          files: [{ path: "AGENTS.md", content: "# no\n" }],
          confirmed: false,
        },
      });
      assert.equal(refused.isError, true);

      const setup = await client.callTool({
        name: "yabgu_host_setup",
        arguments: { host: "cursor" },
      });
      assert.notEqual(setup.isError, true);
      const setupText = String(
        (setup.content as Array<{ text?: string }>)[0]?.text ?? "",
      );
      assert.match(setupText, /type": "stdio"/);

      const codex = await client.callTool({
        name: "yabgu_host_setup",
        arguments: { host: "codex" },
      });
      assert.notEqual(codex.isError, true);
      const codexText = String(
        (codex.content as Array<{ text?: string }>)[0]?.text ?? "",
      );
      assert.match(codexText, /startup_timeout_sec/);
      assert.match(codexText, /default_tools_approval_mode = "writes"/);

      const copilot = await client.callTool({
        name: "yabgu_host_setup",
        arguments: { host: "copilot" },
      });
      assert.notEqual(copilot.isError, true);
      const copilotText = String(
        (copilot.content as Array<{ text?: string }>)[0]?.text ?? "",
      );
      assert.match(copilotText, /YABGU_READ_ONLY/);
    } finally {
      await close();
    }
  });

  it("writes via form elicitation accept even without confirmed", async () => {
    const dir = mkdtempSync(join(tmpdir(), "yabgu-elicit-"));
    const { client, close } = await connectClient({
      elicitation: true,
      elicitAction: "accept",
      elicitApprove: true,
    });
    try {
      const written = await client.callTool({
        name: "yabgu_apply",
        arguments: {
          root: dir,
          files: [{ path: "AGENTS.md", content: "# from elicit\n" }],
        },
      });
      assert.notEqual(written.isError, true);
      assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), "# from elicit\n");
    } finally {
      await close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses write when form elicitation is declined", async () => {
    const dir = mkdtempSync(join(tmpdir(), "yabgu-elicit-deny-"));
    const { client, close } = await connectClient({
      elicitation: true,
      elicitAction: "decline",
    });
    try {
      const denied = await client.callTool({
        name: "yabgu_apply",
        arguments: {
          root: dir,
          files: [{ path: "AGENTS.md", content: "# no\n" }],
          confirmed: true,
        },
      });
      assert.equal(denied.isError, true);
      const text = String(
        (denied.content as Array<{ text?: string }>)[0]?.text ?? "",
      );
      assert.match(text, /declined/);
    } finally {
      await close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("scan without root uses CLAUDE_PROJECT_DIR", async () => {
    const prev = process.env.CLAUDE_PROJECT_DIR;
    process.env.CLAUDE_PROJECT_DIR = BARE;
    try {
      const { client, close } = await connectClient();
      try {
        const scanned = await client.callTool({
          name: "yabgu_scan",
          arguments: {},
        });
        assert.notEqual(scanned.isError, true);
        const text = String(
          (scanned.content as Array<{ text?: string }>)[0]?.text ?? "",
        );
        assert.match(text, /bare-repo/);
      } finally {
        await close();
      }
    } finally {
      if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR;
      else process.env.CLAUDE_PROJECT_DIR = prev;
    }
  });

  it("rejects unknown template id", async () => {
    const { client, close } = await connectClient();
    try {
      const result = await client.callTool({
        name: "yabgu_template",
        arguments: { id: "nope" },
      });
      assert.equal(result.isError, true);
    } finally {
      await close();
    }
  });
});
