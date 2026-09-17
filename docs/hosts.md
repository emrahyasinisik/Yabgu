# Host research (official docs)

Source: official URL on every row. No guessing. MCP install differs per host — `yabgu_host_setup` emits the snippet.

Yabgu does not control speaking style. The MCP **proposes** native files for the **current host**; `apply` writes only after approval. Loading every turn remains the host’s job.

**Host ≠ model.** Cursor with a Gemini model still uses Cursor files (`AGENTS.md`, `.cursor/rules`). `GEMINI.md` is Gemini CLI only.

## Native instructions (current catalog)

| Host | Native files | Source |
| --- | --- | --- |
| Cursor | `AGENTS.md`, `.cursor/rules/*.mdc`, skills | [Rules](https://cursor.com/docs/rules) |
| Claude Code | `CLAUDE.md`, `.claude/rules/`, skills | [Memory](https://code.claude.com/docs/en/memory) |
| Codex / ChatGPT desktop+IDE | `AGENTS.md`, `AGENTS.override.md`, `~/.codex/AGENTS.md` | [AGENTS.md](https://developers.openai.com/codex/guides/agents-md) |
| Copilot | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md` | [Custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-repository-instructions) |
| Gemini CLI | `GEMINI.md`, `~/.gemini/GEMINI.md` | [GEMINI.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md) |
| Grok Build | `AGENTS.md`; `grok inspect` | [Grok Build](https://docs.x.ai/build/overview) |
| Windsurf / Cascade | `.devin/rules/` (preferred), `.windsurf/rules/` fallback, `AGENTS.md` | [Memories & Rules](https://docs.windsurf.com/windsurf/cascade/memories) |
| OpenCode | `AGENTS.md`, `opencode.json` | [Config](https://opencode.ai/docs/config/) |
| ChatGPT web chat | No repo file; Custom / Project instructions | Codex is a separate product |

## How MCP connects

Common: **stdio** (local `command` + `args`) everywhere. Snippet generation: `yabgu_host_setup` (per-host json/toml/array). Official Yabgu install is local stdio: process on the user’s machine; the repo never goes to a yabgu server ([privacy](product.md)). Remote **HTTP** is secondary and only the user’s own endpoint. Don’t paste one `mcp.json` onto every host.

### Cursor

- Docs: [cursor.com/docs/mcp](https://cursor.com/docs/mcp)
- Project: `.cursor/mcp.json` — global: `~/.cursor/mcp.json` (project wins on same name)
- CLI uses the same config: [cursor.com/docs/cli/mcp](https://cursor.com/docs/cli/mcp)
- Stdio example: `{ "mcpServers": { "yabgu": { "command": "npx", "args": ["-y", "@emrahyasinisik/yabgu", "mcp"] } } }`
- Variables: `${workspaceFolder}`, `${env:NAME}`, `${userHome}`
- Supports: tools, prompts, resources, roots, elicitation, MCP Apps
- Tools need **approval** by default; toggle in Customize
- Tables often show `type: "stdio"`; many examples omit `type` and use `command` — verify the current schema when applying

### Claude Code

- Docs: [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)
- Stdio: `claude mcp add --transport stdio yabgu -- <command> [args...]` (`--` required)
- Project share: root `.mcp.json` (`--scope project`); prompts for trust
- User: `~/.claude.json`; local is the default
- HTTP is the recommended remote; SSE and `ws` also exist. If `url` is set, `type` is required (`http` / `sse` / `ws`); without it the host assumes stdio and may skip
- Stdio processes get `CLAUDE_PROJECT_DIR` = project root
- `roots/list` + `notifications/roots/list_changed` = directory the session opened + `--add-dir` / additionalDirectories (v2.1.203+)
- Server `instructions` + tool descriptions are **truncated at 2 KB**; with tool search on, instructions mean “when to search these tools”, not tone/voice
- Put critical text first; tool search is on by default — first turn often loads only tool **names** + instructions
- Reserved names: `workspace`, `claude-in-chrome`, … — `yabgu` is free
- Plugin MCP: `.mcp.json` at the plugin root

### Codex / ChatGPT desktop + IDE extension

- Docs: [ChatGPT MCP](https://learn.chatgpt.com/docs/extend/mcp.md), [config](https://developers.openai.com/codex/config-reference)
- Same host: ChatGPT desktop, Codex CLI, IDE — share `~/.codex/config.toml`
- Project: `.codex/config.toml` in a trusted repo
- CLI: `codex mcp add <name> -- <command>`
- TOML: `[mcp_servers.yabgu]` + `command` / `args` or `url` (streamable HTTP)
- `instructions` is cross-tool guidance; the **first 512 characters** must stand alone ([Codex MCP](https://developers.openai.com/codex/mcp))
- `startup_timeout_sec` defaults to **10s** — cold `npx -y` may need more
- `default_tools_approval_mode = "writes"`: read-only tools free, writers need approval
- `chatgpt.com` chat does not read this config

### GitHub Copilot — two surfaces

**VS Code / Copilot Chat (local)**  
- `.vscode/mcp.json` or the user-profile MCP file  
- Docs: [VS Code MCP](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)

**Copilot cloud agent + code review (GitHub.com)**  
- Docs: [Extend coding agent with MCP](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)  
- Repo Settings → Copilot → MCP servers, JSON `mcpServers`  
- `tools` allowlist is effectively required (autonomous, **no approval prompt**); `*` means all tools  
- `type`: `local` / `stdio` / `http` / `sse`  
- Secret names must start with `COPILOT_MCP_`  
- Cloud agent: **tools only** (no resources/prompts); no OAuth remotes  
- Code review: tools without `readOnlyHint: true` are unused  
- VS Code config doesn’t map 1:1: `inputs`/`envFile` → `env`; add `tools` per server

### Gemini CLI

- Docs: [MCP server](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html)
- `mcpServers` in `settings.json` (user `~/.gemini/` or project `.gemini/`)
- Stdio: `command`, `args`, `cwd`, `env`
- `timeout` (ms, tool call), `trust` (false = confirm)
- `gemini mcp add` / `/mcp`
- Prompts can become slash commands

### Grok Build

- Docs: [MCP servers](https://docs.x.ai/build/features/mcp-servers)
- User: `~/.grok/config.toml` (Windows `%USERPROFILE%\.grok\config.toml`)
- Project: `.grok/config.toml` — MCP / plugin / permission only
- `[mcp_servers.yabgu]` with `command`/`args`/`env` or `url`/`headers`
- `${VAR}` expansion; `grok mcp add --scope project`; `grok inspect`
- `startup_timeout_sec` (default 30) — raise for first `npx` download
- **Also** reads `~/.claude.json`, `.cursor/mcp.json`, project `.mcp.json` (can be disabled)

### Windsurf (Cascade)

- Docs: [MCP](https://docs.devin.ai/windsurf/plugins/cascade/mcp)
- Global: `~/.codeium/windsurf/mcp_config.json` (`mcpServers`)
- stdio, Streamable HTTP, SSE, OAuth
- Remote uses `url` or `serverUrl`

### Cline

- VS Code: `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- CLI: `~/.cline/data/settings/cline_mcp_settings.json`
- `mcpServers` + `command` / `args` / `disabled` / `autoApprove`

### OpenCode

- Docs: [Config](https://opencode.ai/docs/config/)
- `opencode.json` → `"mcp": { "yabgu": { "type": "local", "command": ["node", "..."], "enabled": true } }`
- Schema differs from Cursor (`mcp` + `type: local` + command **array**)

## Required install differences

| Topic | What to do |
| --- | --- |
| No single config file | Emit a per-host snippet (json vs toml vs `command` array) |
| Stdio is universal | First release: local stdio; HTTP later |
| Claude `.mcp.json` | `type` field; stdio without `url` |
| Copilot cloud | `tools` allowlist + `readOnlyHint` + `COPILOT_MCP_` |
| Cursor | Approval + `${workspaceFolder}`; marketplace is a separate channel |
| Grok | Own toml + may also ingest Claude/Cursor configs |
| Instructions field | Claude 2 KB + “when to search tools”; Codex first 512 characters |
| Workspace root | MCP `roots/list`; Claude `CLAUDE_PROJECT_DIR`; else cwd |
| Cold npx start | Codex `startup_timeout_sec`; Grok same field |
| Write approval | Cursor elicitation UI; else `confirmed=true`; Copilot cloud → `YABGU_READ_ONLY=1` + no apply on allowlist |
| ChatGPT web | Not a target; Codex/desktop is |

## Out of scope (on purpose)

Amazon Q, Tabnine, Continue, Devin cloud, JetBrains Junie — popular, but MCP schemas were not verified from official pages in this pass. Adding them still requires a docs link.
