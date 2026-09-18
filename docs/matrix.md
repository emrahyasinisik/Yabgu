# Tool × file matrix

Answers: “which tool auto-loads which `.md` file?” Symbols:

- **Yes** — reads by default
- **Setting** — reads with a user/project setting
- **Bridge** — needs import / symlink from a native file
- **No** — does not auto-load
- **Legacy** — still works; prefer newer paths on new projects

## Project-root files

| File | Cursor | Claude Code | Codex | Copilot | Gemini CLI | Grok Build | Windsurf | Cline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | Yes | Bridge (`@AGENTS.md`) | Yes | Yes | Setting | Yes | Yes | Setting / yes |
| `AGENTS.override.md` | No | No | Yes | No | No | No | No | No |
| `CLAUDE.md` | IDE: No · CLI: Yes | Yes | Setting | Yes (some surfaces) | No | Yes | No | No |
| `CLAUDE.local.md` | No | Yes (gitignore) | No | No | No | Yes | No | No |
| `GEMINI.md` | No | No | No | Yes (some surfaces) | Yes | No | No | No |
| `.cursorrules` | Legacy | `/init` may read | No | No | No | No | No | Legacy fallback |
| `.windsurfrules` | No | `/init` may read | No | No | No | No | Legacy | Legacy fallback |

## Native rule directories

| Path | Tool | When loaded |
| --- | --- | --- |
| `.cursor/rules/*.mdc` | Cursor | `alwaysApply`, glob, or `@` mention |
| `.cursor/skills/*/SKILL.md` | Cursor | Relevant task / mention (also `.agents/skills/`, `~/.cursor/skills/`, `~/.agents/skills/`; compat: `.claude/skills/`, `.codex/skills/`) |
| `.grok/rules/*.md` | Grok Build | Every session in the directory tree (compat: also `.claude/rules/`, `.cursor/rules/`) |
| `.claude/CLAUDE.md` | Claude Code | Alternative to `./CLAUDE.md` |
| `.claude/rules/*.md` | Claude Code | Every session or on path match |
| `.claude/skills/*/SKILL.md` | Claude Code | When the skill triggers |
| `.github/copilot-instructions.md` | GitHub Copilot | Repo-wide |
| `.github/instructions/**/*.instructions.md` | GitHub Copilot | `applyTo` glob |
| `.devin/rules/*.md` | Windsurf / Cascade | Preferred workspace rules (`trigger` frontmatter) |
| `.windsurf/rules/*.md` | Windsurf / Cascade | Legacy fallback |
| `.clinerules` or `.clinerules/` | Cline / Roo | Project rules |
| `.devin/rules/` (Devin cloud init) | Devin | Claude `/init` may also read |
| `GEMINI.md` / `.gemini/settings.json` | Gemini CLI | Project + `context.fileName` |
| `opencode.json` + `AGENTS.md` | OpenCode | Native config + instructions |

MCP config files (after install; no schema guessing): [hosts.md](hosts.md)

## User (global) files

| Path | Tool |
| --- | --- |
| `~/.cursor/` rules / user rules (Settings) | Cursor |
| `~/.claude/CLAUDE.md` | Claude Code |
| `~/.codex/AGENTS.md` or `AGENTS.override.md` | Codex |
| `~/.copilot/copilot-instructions.md` | Copilot CLI |
| `~/.gemini/GEMINI.md` | Gemini CLI |
| `~/.grok/config.toml` | Grok Build (MCP / plugin; not instructions) |
| `~/.codex/config.toml` | Codex (MCP; instructions live in `AGENTS.md`) |

## ChatGPT web

ChatGPT chat (chatgpt.com) does **not** auto-read `AGENTS.md` / `CLAUDE.md` in the repo.

| Surface | Where to write |
| --- | --- |
| ChatGPT Custom instructions | Settings → Personalization |
| ChatGPT Projects | Project instructions |
| Custom GPT | GPT builder → Instructions |
| Codex / ChatGPT coding agent | Repo `AGENTS.md` |

Details: [tools/chatgpt-codex.md](../tools/chatgpt-codex.md)

## Notes (surface-specific)

- **Cursor:** Project Rules docs list `AGENTS.md` + `.cursor/rules/*.mdc` for the IDE Agent. [Cursor CLI](https://cursor.com/docs/cli/using) also loads root `CLAUDE.md` as rules. Prefer `AGENTS.md` as the shared source; treat `CLAUDE.md` as Claude-native + Cursor CLI compat, not as Cursor IDE’s primary file.
- **Grok Build:** Official discovery loads `AGENTS.md` / `CLAUDE.md` / `CLAUDE.local.md` and `*.md` under `.grok/rules/` (plus `.claude/rules/` / `.cursor/rules/` for compatibility). See [project rules](https://docs.x.ai/build/features/project-rules).
- **Copilot code review:** Official support matrix lists agent instructions as **`AGENTS.md` only** on GitHub.com code review (not `CLAUDE.md` / `GEMINI.md`). Those root files apply on other surfaces (e.g. cloud agent, CLI). See [custom instructions support](https://docs.github.com/en/copilot/reference/custom-instructions-support).
