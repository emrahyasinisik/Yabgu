# Grok Build

Grok Build loads project rules from the directory tree. Primary shared file for multi-host setups is still root `AGENTS.md`. A separate `GROK.md` is not required.

## Files to use

| File | Note |
| --- | --- |
| `AGENTS.md` (also `Agents.md`, `AGENT.md`) | Project instructions (preferred shared source) |
| `CLAUDE.md` / `Claude.md` / `CLAUDE.local.md` | Also loaded by Grok ([project rules](https://docs.x.ai/build/features/project-rules)); keep thin if present (`@AGENTS.md` for Claude) |
| `.grok/rules/*.md` | Native Grok rule directory |
| `.claude/rules/`, `.cursor/rules/` | Read for compatibility |
| Skills / hooks | Task procedures and hard checks; not a substitute for `AGENTS.md` |
| `~/.grok/` global rules | User-wide |
| `~/.grok/config.toml` / `.grok/config.toml` | MCP / model / plugin (not instruction body) |

Discovery order (official): global `~/.grok/` → every directory from repo root down to the working directory; deeper files win on conflicts. Files ignored by `.gitignore` are skipped.

To inspect loaded instructions, skills, hooks, and MCP:

```bash
grok inspect
```

Use plan mode for large changes. Writing: short, commands, bans — [how-to-write.md](../docs/how-to-write.md).

## Sharing with AGENTS.md

Prefer one shared `AGENTS.md` (same as Cursor / Codex / Copilot). If Claude is in the mix, keep a thin `CLAUDE.md` that only `@AGENTS.md` — Grok may also load that file, so do not put conflicting rules there.

Do not embed long procedures in `AGENTS.md` → use a skill. Do not write conversation tone (out of Yabgu scope).

## MCP

Setup snippet: `yabgu_host_setup` host=`grok`.  
Official: [MCP servers](https://docs.x.ai/build/features/mcp-servers) · [Grok Build](https://docs.x.ai/build/overview) · [Project rules](https://docs.x.ai/build/features/project-rules)

Grok can also read `~/.claude.json`, `.cursor/mcp.json`, and project `.mcp.json` (compat; can be disabled). Raise `startup_timeout_sec` for cold `npx` starts.

## Source

- https://docs.x.ai/build/overview
- https://docs.x.ai/build/features/project-rules
- https://docs.x.ai/build/features/mcp-servers
