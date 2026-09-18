# GitHub Copilot

Copilot reads both its native files and `AGENTS.md`. Which surface reads which file varies — check the [support matrix](https://docs.github.com/en/copilot/reference/custom-instructions-support). For a multi-host repo, keep root `AGENTS.md` + `.github/copilot-instructions.md`.

## Files to use

| File | Scope |
| --- | --- |
| `.github/copilot-instructions.md` | Repo-wide (Chat, review, coding agent, CLI — most surfaces) |
| `.github/instructions/**/*.instructions.md` | Path-specific (`applyTo` glob) |
| `AGENTS.md` | Agent instructions (root + nested); **code review on GitHub.com includes this** |
| `CLAUDE.md` / `GEMINI.md` | Agent instructions on **some** surfaces (e.g. cloud agent, CLI) — **not** listed for GitHub.com code review agent instructions |
| `~/.copilot/copilot-instructions.md` | Copilot CLI, user-wide |
| `~/.copilot/instructions/**/*.instructions.md` | Copilot CLI, modular personal |

## Repo-wide

```markdown
# Copilot instructions

- Stack: ...
- Test: `npm test`
- PR: small diffs, add tests
```

Keep it short. Long shared rules stay in `AGENTS.md`; this file holds the summary Copilot needs on every hint.

## Path-specific

File name must end with `*.instructions.md`.

```markdown
---
applyTo: "src/frontend/**/*.{ts,tsx}"
---

Use React Server Components in this folder.
```

Optional `excludeAgent`: `"code-review"` or `"cloud-agent"`.

## AGENTS.md relationship

Copilot supports nested `AGENTS.md`; the nearest file in the tree wins. Sharing with Cursor/Codex: root `AGENTS.md` is enough; for Copilot Chat also add `.github/copilot-instructions.md`.

Copilot CLI expands `@relative/path` imports inside `AGENTS.md` / `CLAUDE.md`. It does not expand those inside `GEMINI.md` or `*.instructions.md`.

## ChatGPT vs Copilot

GitHub Copilot ≠ ChatGPT web. Copilot files are for GitHub / VS Code / CLI. ChatGPT web does not read them.

Write short, non-conflicting sentences. Do not copy long shared text. [how-to-write.md](../docs/how-to-write.md)

## Source

- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- https://docs.github.com/en/copilot/reference/custom-instructions-support
