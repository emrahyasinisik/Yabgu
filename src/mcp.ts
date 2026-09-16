import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { applyFiles } from "./apply.js";
import {
  GET_STARTED_SECTIONS,
  HOST_IDS,
  TEMPLATE_IDS,
  getStartedSection,
  listTemplates,
  readHostGuide,
  readTemplate,
  type HostId,
  type TemplateId,
} from "./content.js";
import { formatMeasureReport, measureRepo } from "./measure.js";
import { planFromScan, type HostHint } from "./plan.js";
import { isReadOnlyFromEnv } from "./policy.js";
import {
  resolveProjectRoot,
  uriToFsPath,
  type WorkspaceRoots,
} from "./root.js";
import { scanRepo } from "./scan.js";
import { SETUP_HOST_IDS, hostSetupSnippet, type SetupHostId } from "./setup.js";

// Claude truncates instructions at 2 KB; Codex wants the first 512 chars self-contained
// (when to search / use this server). Lead with that, no tone/voice rules.
export const SERVER_INSTRUCTIONS = `Search Yabgu when setting up coding-agent instruction files (AGENTS.md, CLAUDE.md, Cursor/Copilot/Gemini adapters, skills) or measuring their health. Local stdio only — does not control how you speak.

Flow: yabgu_scan → yabgu_plan → show drafts → user approval → yabgu_apply. Optional yabgu_measure before/after; yabgu_get_started / yabgu_host_setup / yabgu:// resources; prompt yabgu_setup.

Rules: AGENTS.md is source of truth; omit root to use the host workspace; apply writes only instruction paths (host UI confirm via elicitation when available, else confirmed=true); YABGU_READ_ONLY=1 hides apply; no overwrite of non-empty files unless asked; skills for multi-step procedures; keep AGENTS.md under ~200 lines.`;

export const MAX_INSTRUCTIONS_BYTES = 2048;
/** Codex: keep the first 512 characters self-contained. */
export const MAX_INSTRUCTIONS_LEAD_CHARS = 512;

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const WRITE = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const templateIdEnum = z.enum(TEMPLATE_IDS);
const hostIdEnum = z.enum(HOST_IDS);
const setupHostEnum = z.enum(SETUP_HOST_IDS);
const sectionEnum = z.enum(GET_STARTED_SECTIONS);
const hostHintEnum = z.enum([
  "cursor",
  "claude",
  "codex",
  "copilot",
  "gemini",
  "windsurf",
  "grok",
]);

const rootSchema = z
  .string()
  .optional()
  .describe(
    "Absolute project root. Omit to use the host workspace (MCP roots, CLAUDE_PROJECT_DIR, or cwd).",
  );

function toolError(err: unknown): {
  content: [{ type: "text"; text: string }];
  isError: true;
} {
  const text = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text }], isError: true };
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}

type RootsClient = {
  getClientCapabilities?: () => { roots?: unknown } | undefined;
  listRoots?: () => Promise<{ roots?: Array<{ uri?: string }> }>;
};

async function listHostRoots(server: McpServer): Promise<WorkspaceRoots> {
  const inner = server.server as unknown as RootsClient;
  try {
    if (!inner.getClientCapabilities?.()?.roots || !inner.listRoots) {
      return null;
    }
    const listed = await inner.listRoots();
    const paths = (listed.roots ?? [])
      .map((r) => (r.uri ? uriToFsPath(r.uri) : ""))
      .filter(Boolean);
    return paths.length > 0 ? paths : null;
  } catch {
    return null;
  }
}

async function toolRoot(
  server: McpServer,
  root: string | undefined,
): Promise<string> {
  return resolveProjectRoot(root, await listHostRoots(server));
}

function clientSupportsFormElicitation(server: McpServer): boolean {
  return Boolean(server.server.getClientCapabilities()?.elicitation?.form);
}

/** Ask the host UI to approve writes when the client supports form elicitation. */
async function elicitApplyApproval(
  server: McpServer,
  opts: {
    root: string;
    paths: string[];
    overwrite: boolean;
  },
): Promise<"accept" | "decline" | "cancel" | "unsupported"> {
  if (!clientSupportsFormElicitation(server)) return "unsupported";

  const pathList = opts.paths.map((p) => `- ${p}`).join("\n");
  const overwriteLine = opts.overwrite
    ? "Overwrite non-empty files: YES (user asked)."
    : "Overwrite non-empty files: no (skip existing).";

  try {
    const result = await server.server.elicitInput({
      mode: "form",
      message: [
        "Yabgu wants to write instruction files under this project root.",
        `Root: ${opts.root}`,
        overwriteLine,
        "Files:",
        pathList || "(none)",
        "Approve only if you reviewed the drafts.",
      ].join("\n"),
      requestedSchema: {
        type: "object",
        properties: {
          approve: {
            type: "boolean",
            title: "Approve write",
            description: "Write the listed instruction files to disk",
            default: false,
          },
        },
        required: ["approve"],
      },
    });

    if (result.action === "accept" && result.content?.approve === true) {
      return "accept";
    }
    if (result.action === "decline") return "decline";
    return "cancel";
  } catch {
    // Host advertised form elicitation but the call failed — fall back to confirmed.
    return "unsupported";
  }
}

export type CreateServerOptions = {
  /** When true, do not register yabgu_apply. Defaults to YABGU_READ_ONLY env. */
  readOnly?: boolean;
};

export function createServer(opts: CreateServerOptions = {}): McpServer {
  const readOnly = opts.readOnly ?? isReadOnlyFromEnv();
  const server = new McpServer(
    { name: "yabgu", version: "0.1.0" },
    { instructions: SERVER_INSTRUCTIONS },
  );

  // ── Resources ───────────────────────────────────────────────

  server.registerResource(
    "yabgu-template",
    new ResourceTemplate("yabgu://template/{id}", {
      list: async () => ({
        resources: listTemplates().map((t) => ({
          uri: `yabgu://template/${t.id}`,
          name: t.id,
          description: `Starter → ${t.copyTo}`,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      title: "Instruction templates",
      description: "Starter templates for AGENTS.md and host adapters",
      mimeType: "text/markdown",
    },
    async (uri, vars) => {
      const id = String(vars.id) as TemplateId;
      if (!TEMPLATE_IDS.includes(id)) {
        throw new Error(`Unknown template id: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: readTemplate(id),
          },
        ],
      };
    },
  );

  server.registerResource(
    "yabgu-host",
    new ResourceTemplate("yabgu://host/{id}", {
      list: async () => ({
        resources: HOST_IDS.map((id) => ({
          uri: `yabgu://host/${id}`,
          name: id,
          description: `Vendor guide for ${id}`,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      title: "Host guides",
      description: "Vendor-backed file names, formats, and limits",
      mimeType: "text/markdown",
    },
    async (uri, vars) => {
      const id = String(vars.id) as HostId;
      if (!HOST_IDS.includes(id)) {
        throw new Error(`Unknown host id: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: readHostGuide(id),
          },
        ],
      };
    },
  );

  server.registerResource(
    "yabgu-doc",
    new ResourceTemplate("yabgu://doc/{name}", {
      list: async () => ({
        resources: ["writing", "matrix", "shared"].map((name) => ({
          uri: `yabgu://doc/${name}`,
          name,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      title: "Kit docs",
      description: "Writing guide, matrix, shared source of truth",
      mimeType: "text/markdown",
    },
    async (uri, vars) => {
      const name = String(vars.name);
      const section =
        name === "writing" || name === "matrix" || name === "shared"
          ? name
          : null;
      if (!section) throw new Error(`Unknown doc: ${name}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: getStartedSection(section),
          },
        ],
      };
    },
  );

  // ── Prompt ──────────────────────────────────────────────────

  server.registerPrompt(
    "yabgu_setup",
    {
      title: "Set up instruction files",
      description:
        "Scan this repo and propose only justified AGENTS.md / adapters. No tone rules.",
      argsSchema: {
        root: z
          .string()
          .optional()
          .describe("Absolute project root. Defaults to the host workspace."),
        hosts: z
          .string()
          .optional()
          .describe(
            "Comma-separated hosts: cursor,claude,codex,copilot,gemini,windsurf,grok",
          ),
      },
    },
    async ({ root, hosts }) => {
      const hostList = hosts?.trim()
        ? hosts
        : "cursor,codex,copilot,grok";
      const rootLine = root?.trim()
        ? `Use root \`${root.trim()}\`.`
        : "Omit root so tools use the host workspace.";
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                "Set up coding-agent instruction files for this repository with Yabgu.",
                rootLine,
                `Hosts: ${hostList}.`,
                "1. Call yabgu_measure then yabgu_scan.",
                "2. Call yabgu_plan with those hosts.",
                "3. Show each proposed file and why it is needed. Do not write yet.",
                "4. After I approve, call yabgu_apply (host UI may confirm; otherwise use confirmed=true).",
                "5. Call yabgu_measure again and summarize before/after (score, missing files, tone hits).",
                "Do not add tone/voice rules. Do not overwrite non-empty files unless I ask. Continue my original task afterward.",
              ].join("\n"),
            },
          },
        ],
      };
    },
  );

  // ── Tools ───────────────────────────────────────────────────

  server.registerTool(
    "yabgu_get_started",
    {
      title: "Get started",
      description:
        "When you need writing rules, the file matrix, or template/host ids. Prefer section=index|writing|matrix|shared; section=all is the full pack.",
      inputSchema: {
        section: sectionEnum
          .default("index")
          .describe("Which pack to return. Default index (short)."),
      },
      annotations: READ_ONLY,
    },
    async ({ section }) => {
      try {
        return textResult(getStartedSection(section ?? "index"));
      } catch (err) {
        return toolError(err);
      }
    },
  );

  server.registerTool(
    "yabgu_template",
    {
      title: "Instruction template",
      description:
        "When you need a starter AGENTS.md / adapter / skill template. Fill with real project details before writing.",
      inputSchema: {
        id: templateIdEnum.describe("Template id (see yabgu_get_started)."),
      },
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return textResult(readTemplate(id as TemplateId));
      } catch (err) {
        return toolError(err);
      }
    },
  );

  server.registerTool(
    "yabgu_host_guide",
    {
      title: "Host guide",
      description:
        "When you need vendor-backed file names, formats, and limits for one host.",
      inputSchema: {
        host: hostIdEnum.describe("Host id. others covers Cline/Grok/Aider/…"),
      },
      annotations: READ_ONLY,
    },
    async ({ host }) => {
      try {
        return textResult(readHostGuide(host as HostId));
      } catch (err) {
        return toolError(err);
      }
    },
  );

  server.registerTool(
    "yabgu_host_setup",
    {
      title: "MCP install snippet",
      description:
        "When installing this MCP: correct stdio snippet for one host (Cursor JSON, Claude CLI, Codex TOML, Copilot allowlist, …).",
      inputSchema: {
        host: setupHostEnum.describe("Host to generate an install snippet for."),
      },
      annotations: READ_ONLY,
    },
    async ({ host }) => {
      try {
        return textResult(hostSetupSnippet(host as SetupHostId));
      } catch (err) {
        return toolError(err);
      }
    },
  );

  server.registerTool(
    "yabgu_scan",
    {
      title: "Scan repo",
      description:
        "When planning instruction files: local shallow scan (languages, package manager, scripts, existing instruction files). Does not upload or write.",
      inputSchema: {
        root: rootSchema,
      },
      annotations: READ_ONLY,
    },
    async ({ root }) => {
      try {
        return jsonResult(scanRepo(await toolRoot(server, root)));
      } catch (err) {
        return toolError(err);
      }
    },
  );

  server.registerTool(
    "yabgu_plan",
    {
      title: "Plan instruction files",
      description:
        "When the repo has been scanned: propose only justified AGENTS.md/adapters with drafts. Does not write.",
      inputSchema: {
        root: rootSchema,
        hosts: z
          .array(hostHintEnum)
          .optional()
          .describe("Hosts to optimize for. Default: cursor,codex,copilot,grok."),
      },
      annotations: READ_ONLY,
    },
    async ({ root, hosts }) => {
      try {
        const scan = scanRepo(await toolRoot(server, root));
        const plan = planFromScan(scan, hosts as HostHint[] | undefined);
        return jsonResult({ scan, plan });
      } catch (err) {
        return toolError(err);
      }
    },
  );

  if (!readOnly) {
    server.registerTool(
      "yabgu_apply",
      {
        title: "Apply approved files",
        description:
          "Write instruction files the user already approved (AGENTS.md / adapters / skills only). Hosts with form elicitation confirm in the UI; otherwise requires confirmed=true. Skips non-empty files unless overwrite=true. Unavailable when YABGU_READ_ONLY=1.",
        inputSchema: {
          root: rootSchema,
          files: z
            .array(
              z.object({
                path: z
                  .string()
                  .describe(
                    "Relative instruction path, e.g. AGENTS.md or .cursor/rules/foo.mdc.",
                  ),
                content: z.string().describe("Full file contents to write."),
              }),
            )
            .describe("Files the user approved."),
          confirmed: z
            .boolean()
            .optional()
            .describe(
              "Required when the host has no form elicitation. Must be true only after explicit user approval.",
            ),
          overwrite: z
            .boolean()
            .optional()
            .describe("Overwrite non-empty files only if the user asked."),
        },
        annotations: WRITE,
      },
      async ({ root, files, confirmed, overwrite }) => {
        try {
          const absRoot = await toolRoot(server, root);
          const overwriteFlag = overwrite === true;
          const paths = files.map((f) => f.path);

          const elicit = await elicitApplyApproval(server, {
            root: absRoot,
            paths,
            overwrite: overwriteFlag,
          });

          let allowed = false;
          if (elicit === "accept") {
            allowed = true;
          } else if (elicit === "unsupported") {
            if (confirmed !== true) {
              throw new Error(
                "yabgu: refuse to write — host has no form elicitation; set confirmed=true only after the user approved each file.",
              );
            }
            allowed = true;
          } else {
            throw new Error(
              `yabgu: refuse to write — user ${elicit === "decline" ? "declined" : "cancelled"} the write in the host UI.`,
            );
          }

          return jsonResult(
            applyFiles(absRoot, files, {
              confirmed: allowed,
              overwrite: overwriteFlag,
            }),
          );
        } catch (err) {
          return toolError(err);
        }
      },
    );
  }

  server.registerTool(
    "yabgu_measure",
    {
      title: "Measure setup health",
      description:
        "When checking instruction-file health before/after setup: local heuristic (presence, adapters, tone-rule hits) — not a token-savings claim.",
      inputSchema: {
        root: rootSchema,
      },
      annotations: READ_ONLY,
    },
    async ({ root }) => {
      try {
        const report = measureRepo(await toolRoot(server, root));
        return textResult(
          `${formatMeasureReport(report)}\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\``,
        );
      } catch (err) {
        return toolError(err);
      }
    },
  );

  return server;
}

export async function startMcp(): Promise<void> {
  const readOnly = isReadOnlyFromEnv();
  const server = createServer({ readOnly });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    readOnly
      ? "yabgu MCP server running on stdio (YABGU_READ_ONLY: apply disabled)"
      : "yabgu MCP server running on stdio",
  );
}
