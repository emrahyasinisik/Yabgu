# GitHub Copilot

Copilot reads both its native files and `AGENTS.md`. Which surface reads what varies by feature; keeping both in the repo setup is the safest approach.

## Files to use

| File | Scope |
| --- | --- |
| `.github/copilot-instructions.md` | Repo-wide (Chat, review, coding agent, CLI) |
| `.github/instructions/**/*.instructions.md` | Path-specific (`applyTo` glob) |
| `AGENTS.md` | Agent instructions (root + nested) |
| `CLAUDE.md` / `GEMINI.md` | Some Copilot surfaces (CLI, coding agent, review) also read the root file |
| `~/.copilot/copilot-instructions.md` | Copilot CLI, user-wide |
| `~/.copilot/instructions/**/*.instructions.md` | Copilot CLI, modular personal |

## Repo-wide

```markdown
# Copilot instructions

- Stack: ...
- Test: `npm test`
- PR: small diff, add tests
```

Keep it short. Leave long shared rules in `AGENTS.md`; this file should hold the summary Copilot needs on every hint.

## Path-specific

The filename must end with `*.instructions.md`.

```markdown
---
applyTo: "src/frontend/**/*.{ts,tsx}"
---

Use React Server Components in this folder.
```

Optional `excludeAgent`: `"code-review"` or `"cloud-agent"`.

## Relationship to AGENTS.md

Copilot supports nested `AGENTS.md`; the file closest to the working directory takes precedence. A root `AGENTS.md` is enough to share with Cursor/Codex; also add `.github/copilot-instructions.md` for Copilot Chat.

Copilot CLI expands `@relative/path` imports inside `AGENTS.md` / `CLAUDE.md`. It does not expand them inside `GEMINI.md` or `*.instructions.md`.

## ChatGPT vs Copilot

GitHub Copilot ≠ ChatGPT web. Copilot files are for GitHub/VS Code/CLI. ChatGPT web does not read them.

Write short, non-conflicting sentences. Do not copy long shared text. [how-to-write.md](../docs/how-to-write.md)

## Source

- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- https://docs.github.com/en/copilot/reference/custom-instructions-support
