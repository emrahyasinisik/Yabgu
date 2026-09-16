# Project instructions for coding agents

Replace the placeholders. Keep this file short enough to scan (Claude: aim under 200 lines; Codex truncates around 32 KiB combined).

Write only what the code cannot say. Each bullet should prevent a real mistake. Tool-specific notes belong in adapter files (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`), not here.

## Overview

- What this repo is (2–4 sentences, including decisions a new teammate would miss): (fill from README / code)
- Primary languages / frameworks / package manager: TypeScript / React, Express, Vite, Prisma; package manager **npm**

## Commands

Exact commands the agent should run. If you list a test command, agents will try to run it before finishing.

```bash
npm run dev  # vite
npm run server  # tsx src/server.ts
npm run test  # vitest run
npm run lint  # eslint .
npm run typecheck  # tsc --noEmit
npm run db:migrate  # echo "prisma migrate (schema not checked in yet)"
npm run db:seed  # echo "seed stub"
```

## Layout

Only non-obvious paths:

- `src/` —
- `tests/` —

## Style

Concrete and checkable. Prefer “do not” over vague “write clean code”.

- Formatter / linter (name the tool; do not restate its rules):
- Naming:
- Error handling:

## Testing

- When to add tests:
- How to run a single test:

## Do not

- Do not commit secrets or `.env` files
- Do not change public APIs without a matching test
- Do not add dependencies without a reason in the PR

## Pull requests

- Small diffs
- Describe why, not only what
- CI must be green

## Code review (optional)

Keep lint and format in CI. Put only behavior the reviewer/agent should flag:

- Safe path / exception:
