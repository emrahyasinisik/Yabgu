import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  classifyInstructionFiles,
  detectHostFromClientName,
  detectHostFromEnv,
  planWarnings,
  resolveHostSession,
} from "../src/hosts.js";
import { formatMeasureReport, measureRepo } from "../src/measure.js";
import { formatPlanReport, planFromScan } from "../src/plan.js";
import {
  formatScanReport,
  parseMakefileTargets,
  readmeBlurbFrom,
  scanRepo,
} from "../src/scan.js";

const FIX = join(fileURLToPath(new URL(".", import.meta.url)), "..", "fixtures");
const NONE = {};

describe("report framing helpers", () => {
  it("parses Makefile targets and README blurbs", () => {
    assert.deepEqual(
      parseMakefileTargets(".PHONY: up down\nup:\n\techo\ndown:\n\techo\n"),
      ["up", "down"],
    );
    assert.equal(
      readmeBlurbFrom("# Hub\n\nMulti-marketplace platform.\n\n## More\n"),
      "Hub — Multi-marketplace platform.",
    );
  });

  it("measure and plan reports lead with best practices", () => {
    const root = join(FIX, "monorepo");
    const session = resolveHostSession({ clientName: "cursor", env: NONE });
    const scan = scanRepo(root);
    const measureText = formatMeasureReport(measureRepo(root, scan, session), session, scan);
    assert.match(measureText, /Best practices/);
    assert.match(measureText, /single source of truth|root `AGENTS\.md`/);
    assert.match(measureText, /Present to the user/);
    const plan = planFromScan(scan, undefined, session);
    const planText = formatPlanReport(plan, scan);
    assert.match(planText, /Best practices/);
    assert.match(planText, /Monorepo/);
    assert.match(planText, /do not upsell|Do not create Copilot/i);
  });
});

describe("host detection", () => {
  it("maps known MCP clientInfo names", () => {
    assert.equal(detectHostFromClientName("cursor"), "cursor");
    assert.equal(detectHostFromClientName("Cursor"), "cursor");
    assert.equal(detectHostFromClientName("gemini-cli-mcp-client"), "gemini");
    assert.equal(detectHostFromClientName("claude-code"), "claude");
    assert.equal(detectHostFromClientName("github-copilot-cli"), "copilot");
    assert.equal(detectHostFromClientName("codex"), "codex");
    assert.equal(detectHostFromClientName("Visual Studio Code"), null);
  });

  it("uses only unambiguous env", () => {
    assert.equal(detectHostFromEnv({ CLAUDE_PROJECT_DIR: "/tmp/proj" }), "claude");
    assert.equal(detectHostFromEnv({ CURSOR_TRACE_ID: "abc" }), "cursor");
    assert.equal(detectHostFromEnv({ TERM_PROGRAM: "vscode" }), null);
    assert.equal(detectHostFromEnv(NONE), null);
  });

  it("prefers clientInfo over env", () => {
    const session = resolveHostSession({
      clientName: "cursor",
      env: { CLAUDE_PROJECT_DIR: "/tmp" },
    });
    assert.equal(session.host, "cursor");
    assert.equal(session.source, "clientInfo");
  });
});

describe("scan classification", () => {
  it("does not treat GEMINI.md as a Cursor gap", () => {
    const session = resolveHostSession({ clientName: "cursor", env: NONE });
    const classified = classifyInstructionFiles(
      [
        { path: "AGENTS.md", exists: false, empty: true },
        { path: "GEMINI.md", exists: false, empty: true },
        { path: "CLAUDE.md", exists: false, empty: true },
        { path: ".cursor/rules", exists: false, empty: true },
      ],
      session,
    );
    assert.deepEqual(classified.missingForSession, ["AGENTS.md"]);
    assert.ok(classified.otherHostAbsent.includes("GEMINI.md"));
    assert.ok(classified.otherHostAbsent.includes("CLAUDE.md"));
    assert.ok(classified.optionalForSession.includes(".cursor/rules"));
  });

  it("treats GEMINI.md as the Gemini CLI gap", () => {
    const session = resolveHostSession({
      clientName: "gemini-cli-mcp-client",
      env: NONE,
    });
    const classified = classifyInstructionFiles(
      [
        { path: "AGENTS.md", exists: false, empty: true },
        { path: "GEMINI.md", exists: false, empty: true },
        { path: ".cursor/rules", exists: false, empty: true },
      ],
      session,
    );
    assert.ok(classified.missingForSession.includes("GEMINI.md"));
    assert.ok(classified.otherHostAbsent.includes(".cursor/rules"));
    const warnings = planWarnings(session, ["gemini"], []);
    assert.ok(warnings.some((w) => /Gemini CLI will not see/.test(w)));
  });
});

describe("monorepo scan", () => {
  it("reads nested package.json / go.mod / AGENTS.md", () => {
    const scan = scanRepo(join(FIX, "monorepo"));
    assert.ok(scan.frameworks.includes("Next.js"));
    assert.ok(scan.frameworks.includes("React"));
    assert.ok(scan.frameworks.includes("gqlgen"));
    assert.ok(scan.frameworks.includes("chi"));
    assert.ok(scan.frameworks.includes("FastAPI"));
    assert.equal(scan.hasMakefile, true);
    assert.ok(scan.workspaces.some((w) => w.dir === "frontend" && w.ecosystem === "npm"));
    assert.ok(scan.workspaces.some((w) => w.dir === "backend" && w.ecosystem === "go"));
    assert.ok(scan.workspaces.some((w) => w.dir === "inference" && w.ecosystem === "pip"));
    assert.ok(scan.nestedInstructions.some((f) => f.path === "frontend/AGENTS.md"));
    assert.ok(scan.nestedInstructions.some((f) => f.path === "backend/.cursor/AGENTS.md"));
    assert.ok(scan.notes.some((n) => /monorepo/i.test(n)));
    assert.equal(
      scan.notes.some((n) => /No readable package.json — commands/.test(n)),
      false,
    );
  });

  it("formats a Cursor scan without listing GEMINI.md as a gap", () => {
    const scan = scanRepo(join(FIX, "monorepo"));
    const session = resolveHostSession({ clientName: "cursor", env: NONE });
    const text = formatScanReport(scan, session);
    assert.match(text, /Best practices/);
    assert.match(text, /This session is Cursor/);
    assert.match(text, /Host ≠ model/);
    const [sessionBlock, otherBlock] = text.split("## Other hosts");
    assert.match(sessionBlock, /`AGENTS\.md`/);
    assert.doesNotMatch(sessionBlock, /Missing[\s\S]*`GEMINI\.md`/);
    assert.match(otherBlock, /GEMINI\.md/);
    assert.match(text, /frontend\/AGENTS\.md/);
    assert.match(text, /Next\.js/);
    assert.match(text, /make up/);
  });
});

describe("plan is session-scoped", () => {
  it("does not propose GEMINI.md or Copilot files for a Cursor session", () => {
    const scan = scanRepo(join(FIX, "monorepo"));
    const session = resolveHostSession({ clientName: "cursor", env: NONE });
    const plan = planFromScan(scan, undefined, session);
    assert.deepEqual(plan.hosts, ["cursor"]);
    const paths = plan.proposals.filter((p) => p.action === "create").map((p) => p.path);
    assert.deepEqual(paths, ["AGENTS.md"]);
    assert.equal(plan.proposals.some((p) => p.path === "GEMINI.md"), false);
    assert.equal(
      plan.proposals.some((p) => p.path === ".github/copilot-instructions.md"),
      false,
    );
    const draft = plan.proposals.find((p) => p.path === "AGENTS.md")?.draft ?? "";
    assert.match(draft, /cd frontend && npm run test/);
    assert.match(draft, /make up/);
    assert.match(draft, /cd backend && go test/);
    assert.match(draft, /frontend\/AGENTS\.md/);
    assert.match(
      plan.proposals.find((p) => p.path === "AGENTS.md")?.reason ?? "",
      /Nested/,
    );
  });

  it("proposes GEMINI.md for a Gemini CLI session", () => {
    const scan = scanRepo(join(FIX, "monorepo"));
    const session = resolveHostSession({
      clientName: "gemini-cli-mcp-client",
      env: NONE,
    });
    const plan = planFromScan(scan, undefined, session);
    assert.ok(plan.proposals.some((p) => p.path === "GEMINI.md" && p.action === "create"));
    assert.ok(plan.warnings.some((w) => /Gemini CLI will not see/.test(w)));
  });

  it("unknown session plans AGENTS.md only", () => {
    const scan = scanRepo(join(FIX, "bare-repo"));
    const session = resolveHostSession({ clientName: "yabgu-test", env: NONE });
    const plan = planFromScan(scan, undefined, session);
    assert.deepEqual(plan.hosts, []);
    const create = plan.proposals.filter((p) => p.action === "create").map((p) => p.path);
    assert.deepEqual(create, ["AGENTS.md"]);
  });
});
