import type { HostId } from "./content.js";

export type SetupHostId = HostId | "opencode" | "cline";

/**
 * Vendor-shaped stdio snippets for installing the yabgu MCP.
 * Sourced from docs/hosts.md research — not a single shared schema.
 */
export function hostSetupSnippet(host: SetupHostId): string {
  switch (host) {
    case "cursor":
      return `# Cursor — .cursor/mcp.json (or ~/.cursor/mcp.json)
# Docs: https://cursor.com/docs/mcp

{
  "mcpServers": {
    "yabgu": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@emrahyasinisik/yabgu", "mcp"]
    }
  }
}
`;
    case "claude":
      return `# Claude Code
# Docs: https://code.claude.com/docs/en/mcp

claude mcp add --transport stdio yabgu -- npx -y @emrahyasinisik/yabgu mcp

# Project share (.mcp.json) uses scope project and may prompt for trust.
`;
    case "codex":
      return `# Codex / ChatGPT desktop+IDE — ~/.codex/config.toml
# Docs: https://developers.openai.com/codex/mcp
# npx cold-start often exceeds the 10s default; raise startup_timeout_sec.
# writes = prompt for tools that are not read-only (yabgu_apply).

[mcp_servers.yabgu]
command = "npx"
args = ["-y", "@emrahyasinisik/yabgu", "mcp"]
startup_timeout_sec = 20
default_tools_approval_mode = "writes"
`;
    case "copilot":
      return `# GitHub Copilot — two surfaces

## VS Code / Copilot Chat (.vscode/mcp.json)
{
  "servers": {
    "yabgu": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@emrahyasinisik/yabgu", "mcp"]
    }
  }
}

## Copilot cloud agent (repo Settings → Copilot → MCP)
# Cloud agent does not ask for tool approval — keep apply off the allowlist
# and set YABGU_READ_ONLY so the server never registers yabgu_apply.
{
  "mcpServers": {
    "yabgu": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@emrahyasinisik/yabgu", "mcp"],
      "env": { "YABGU_READ_ONLY": "1" },
      "tools": ["yabgu_get_started", "yabgu_template", "yabgu_host_guide", "yabgu_host_setup", "yabgu_scan", "yabgu_plan", "yabgu_measure"]
    }
  }
}
`;
    case "gemini":
      return `# Gemini CLI — settings.json mcpServers
# Docs: https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html
# trust:false keeps a confirmation prompt (Gemini default).

{
  "mcpServers": {
    "yabgu": {
      "command": "npx",
      "args": ["-y", "@emrahyasinisik/yabgu", "mcp"],
      "timeout": 30000,
      "trust": false
    }
  }
}
`;
    case "grok":
      return `# Grok Build — ~/.grok/config.toml or .grok/config.toml
# Docs: https://docs.x.ai/build/features/mcp-servers
# npx first launch may need a higher startup_timeout_sec (default 30).

[mcp_servers.yabgu]
command = "npx"
args = ["-y", "@emrahyasinisik/yabgu", "mcp"]
startup_timeout_sec = 30
`;
    case "windsurf":
      return `# Windsurf Cascade — ~/.codeium/windsurf/mcp_config.json
# Docs: https://docs.devin.ai/windsurf/plugins/cascade/mcp

{
  "mcpServers": {
    "yabgu": {
      "command": "npx",
      "args": ["-y", "@emrahyasinisik/yabgu", "mcp"]
    }
  }
}
`;
    case "opencode":
      return `# OpenCode — opencode.json (schema differs from Cursor)
# Docs: https://opencode.ai/docs/config/

{
  "mcp": {
    "yabgu": {
      "type": "local",
      "command": ["npx", "-y", "@emrahyasinisik/yabgu", "mcp"],
      "enabled": true
    }
  }
}
`;
    case "cline":
      return `# Cline — cline_mcp_settings.json
{
  "mcpServers": {
    "yabgu": {
      "command": "npx",
      "args": ["-y", "@emrahyasinisik/yabgu", "mcp"],
      "disabled": false
    }
  }
}
`;
    case "others":
      return `# Others (Cline / OpenCode / Aider-adjacent)
# Prefer host-specific IDs: cline, grok, opencode.
# Shared rule: local stdio only; do not point at a yabgu-operated HTTP endpoint.
# See docs/hosts.md, tools/others.md, and tools/grok.md.
`;
    default: {
      const _exhaustive: never = host;
      return _exhaustive;
    }
  }
}

export const SETUP_HOST_IDS = [
  "cursor",
  "claude",
  "codex",
  "copilot",
  "gemini",
  "windsurf",
  "others",
  "grok",
  "opencode",
  "cline",
] as const satisfies readonly SetupHostId[];
