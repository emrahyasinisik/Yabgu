# Cursor

There are three layers for giving project instructions to the Cursor agent. Do not use `.cursorrules` in new projects.

## Files to use

| File | Required? | Purpose |
| --- | --- | --- |
| `AGENTS.md` | Enough for small projects | Plain markdown, root + subfolders |
| `.cursor/rules/*.mdc` | When you need scoped rules | `alwaysApply`, `globs`, `description` |
| `.cursor/skills/<name>/SKILL.md` | When you need a task procedure | PR review, commit format, domain work |
| User Rules (Settings) | Personal preference | Your style across all projects |
| `.cursorrules` | No | Legacy single file; do not write in new projects |

Cursor does not read `CLAUDE.md` or `GEMINI.md`. Using a Gemini (or Claude, GPT, Grok) **model** inside Cursor does not change that — those files are for other *hosts* (Gemini CLI, Claude Code), not for a model picker.

## AGENTS.md

Plain markdown at the root or in a subfolder:

```text
project/
  AGENTS.md
  frontend/AGENTS.md
  backend/AGENTS.md
```

A file in a subfolder merges with its parents when you work in that tree; the more specific one takes precedence.

Content: build commands, tests, style, "do not" list. No frontmatter.

## `.cursor/rules/*.mdc`

Plain `.md` in this folder is **ignored**. The extension must be `.mdc` and YAML frontmatter is required.

```markdown
---
description: TypeScript rules
globs: **/*.{ts,tsx}
alwaysApply: false
---

# TypeScript

- strict mode
- no any
```

| Mode | Frontmatter |
| --- | --- |
| Every chat | `alwaysApply: true` |
| When a matching file is open | `globs: **/*.ts` |
| Let the model decide | `description: ...` + `alwaysApply: false` (no glob) |
| Manual `@rule` | description present, alwaysApply false |

Templates:

- [`templates/cursor/always-apply.mdc`](../templates/cursor/always-apply.mdc)
- [`templates/cursor/glob-rule.mdc`](../templates/cursor/glob-rule.mdc)

## Skills

```text
.cursor/skills/review-pr/SKILL.md
```

Put `name` and `description` in the frontmatter. The description controls when the agent picks the skill.

Personal skill: `~/.cursor/skills/<name>/SKILL.md`  
Project skill: `.cursor/skills/<name>/SKILL.md`

Template: [`templates/skills/SKILL.md`](../templates/skills/SKILL.md)

## What to write where

- ~10 lines needed every session → `AGENTS.md` or an always-apply rule
- Rule needed only in React files → glob `.mdc`
- 40-step release checklist → skill
- API keys, local URLs → User Rules or a gitignored file

Shared writing guidance: [how-to-write.md](../docs/how-to-write.md)

## Source

- https://cursor.com/docs/rules
