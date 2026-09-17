# Grok Build

Grok Build reads root `AGENTS.md`. A separate `GROK.md` is not required.

## Files to use

| File | Note |
| --- | --- |
| `AGENTS.md` | Project instructions (primary) |
| Skills | Task procedures; not injected every turn |
| Hooks | Hard bans / automated checks |
| `~/.grok/config.toml` | User MCP / model / plugin |
| `.grok/config.toml` | Project MCP / plugin / permission (not instructions) |

To inspect loaded instructions, skills, hooks, and MCP:

```bash
grok inspect
```

Use plan mode for large changes. Writing: short, commands, bans — [how-to-write.md](../docs/how-to-write.md).

## Sharing with AGENTS.md

The same `AGENTS.md` as Cursor / Codex / Copilot is enough. If you use Claude, also keep a thin `CLAUDE.md` (`@AGENTS.md`); Grok does not read it.

Do not embed long procedures in `AGENTS.md` → use a skill. Do not write conversation tone (out of Yabgu scope).

## MCP

Setup snippet: `yabgu_host_setup` host=`grok`.  
Official: [MCP servers](https://docs.x.ai/build/features/mcp-servers) · [Grok Build](https://docs.x.ai/build/overview)

Grok can also read `~/.claude.json`, `.cursor/mcp.json`, and project `.mcp.json` (compat; can be disabled). Raise `startup_timeout_sec` for cold `npx` starts.

## Source

- https://docs.x.ai/build/overview
- https://docs.x.ai/build/features/mcp-servers
