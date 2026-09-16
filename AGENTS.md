# yabgu

Yabgu is an Old Turkic title: the ruler who carries out the khagan's work. This repo is that layer for coding agents — short instruction files, not the model itself.

Purpose: help people use Cursor, Claude, ChatGPT/Codex, and similar agents more accurately, more effectively, and with fewer tokens.

Do that by putting the right short instruction files in the right place — not by switching models and not by duplicating the same rules into every tool file.

## Commands

There is no build. Edit markdown, then commit.

## Layout

- `README.md` — purpose, file matrix, how to copy templates
- `docs/` — comparison matrix and shared-source setup
- `tools/` — per-product file lists
- `templates/` — copy-paste starter files

## Style

- Lead with the outcome (accuracy + lower tokens), then the filenames.
- Keep tool guides factual and short.
- Templates stay in English; catalog copy may be Turkish.
- Do not invent filenames. If a loader is version-specific, say so.

## Do not

- Do not duplicate the same long rule set in every adapter file (that wastes tokens and causes conflicts).
- Do not put multi-step procedures in always-on files; use skills.
- Do not commit `CLAUDE.local.md` or `AGENTS.override.md`.
- Do not claim a numeric token savings figure without a measured before/after.
