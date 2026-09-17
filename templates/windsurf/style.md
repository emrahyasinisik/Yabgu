---
trigger: always_on
---

# Style

Place under `.devin/rules/style.md` (preferred) or `.windsurf/rules/style.md` (legacy fallback).

- Follow `AGENTS.md` for commands and architecture.
- Match surrounding code; do not reformat unrelated files.
- Prefer small, reviewable diffs.

For path-scoped rules use `trigger: glob` and a `globs:` pattern instead of `always_on`.
