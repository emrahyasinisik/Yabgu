# yabgu

Yabgu is an Old Turkic title: the ruler who carries out the khagan's work. This repo is that layer for coding agents — short instruction files, not the model itself.

Purpose: better project context and fewer tokens. Do not control how the model speaks to the user.

Finish the catalog and templates first. An MCP comes after that, designed from each popular host's official MCP docs (Cursor, Claude Code, Codex, Copilot, Gemini, Grok). Do not implement the MCP until the kit is done.

## Commands

There is no build yet. Edit markdown, then commit.

## Layout

- `README.md` — purpose, file matrix, how to copy templates
- `docs/` — product rule, writing guide, host/MCP research, comparison matrix
- `tools/` — per-product file lists
- `templates/` — copy-paste starter files

## Style

- Lead with the outcome (accuracy + lower tokens), then the filenames.
- Keep tool guides factual and short. Cite vendor docs when a limit is numeric (200 lines, 32 KiB).
- Templates stay in English; catalog copy may be Turkish.
- Do not invent filenames. If a loader is version-specific, say so.
- Writing rules for instruction files live in `docs/how-to-write.md`. Follow them in templates.

## Do not

- Do not implement the MCP until the catalog/templates are done and the user asks to build it.
- When the MCP exists: local stdio only by default. Do not send repo contents, paths, or telemetry to any yabgu-operated server. The kit author must never see a user’s project.
- Do not add communication, tone, or “how to talk to the user” rules. That is out of scope.
- Do not duplicate the same long rule set in every adapter file (that wastes tokens and causes conflicts).
- Do not put multi-step procedures in always-on files; use skills.
- Do not commit `CLAUDE.local.md` or `AGENTS.override.md`.
- Do not claim a numeric token savings figure without a measured before/after.
