# Single source of truth: AGENTS.md + adapters

Goal: fewer tokens and a more accurate agent. Don’t paste the same rule into three files. Write one `AGENTS.md` and bridge other tools to it. Every copy both bloats context and produces wrong code when copies conflict.

## 1. Write the shared file

Create root `AGENTS.md`. Template: [`templates/AGENTS.md`](../templates/AGENTS.md)

Put in (what code doesn’t say):

- Project overview (2–4 sentences)
- Install / run / test commands — full and runnable
- Style and architecture: concrete “do not” list
- PR / commit expectations

Leave out:

- Long procedures → `SKILL.md`
- Formatting the linter already catches
- Tool-specific UI/mode notes → native file
- Personal sandbox URLs → `*.local.md` / `AGENTS.override.md`

Writing bar: each line should prevent a real mistake; if deleting it changes nothing, delete it. Details: [how-to-write.md](how-to-write.md)

## 2. Claude Code

Claude does not read `AGENTS.md` on its own. At the root:

```markdown
@AGENTS.md

## Claude Code

Use plan mode for large refactors.
```

On Windows prefer `@AGENTS.md` import over a symlink.

## 3. Cursor

Cursor reads both `AGENTS.md` and `.cursor/rules/*.mdc`.

- Shared rules → `AGENTS.md`
- “Only when `**/*.ts` is open” scoped rules → `.mdc`
- Don’t use legacy `.cursorrules`; use `.cursor/rules/` on new projects

## 4. Codex / ChatGPT coding agent

No extra file required. `AGENTS.md` is enough.

Local override (do not commit):

```text
AGENTS.override.md
```

or global:

```text
~/.codex/AGENTS.md
```

ChatGPT **web** chat does not read the repo file → [`templates/chatgpt/web-instructions.md`](../templates/chatgpt/web-instructions.md).

## 5. Copilot

Use two layers:

1. `AGENTS.md` — agent instructions
2. `.github/copilot-instructions.md` — short repo summary (Copilot Chat / review)

For path-specific rules: `.github/instructions/*.instructions.md` with `applyTo` frontmatter.

## 6. Gemini CLI

Write `GEMINI.md`. Gemini does not expand `@` imports; copy content or set config.

Settings template: [`templates/gemini/settings.json`](../templates/gemini/settings.json) → `.gemini/settings.json`:

```json
{
  "context": {
    "fileName": ["AGENTS.md", "GEMINI.md"]
  }
}
```

Thin adapter: [`templates/GEMINI.md`](../templates/GEMINI.md)

## 7. Grok Build

Root `AGENTS.md` is enough. Skills / hooks are separate. Verify with `grok inspect`. Guide: [`tools/grok.md`](../tools/grok.md).

## 8. Windsurf / Cascade

`AGENTS.md` + optional `.devin/rules/*.md` (legacy: `.windsurf/rules/`). Don’t duplicate shared rules. Guide: [`tools/windsurf.md`](../tools/windsurf.md).

## 9. Cline / Roo

`AGENTS.md` + thin `.clinerules` (or `.clinerules/`). Template: [`templates/cline/clinerules.md`](../templates/cline/clinerules.md).

## 10. Gitignore

Don’t commit personal files:

```gitignore
CLAUDE.local.md
AGENTS.override.md
*.local.md
```

## Checklist

On a new project:

- [ ] `AGENTS.md` exists
- [ ] Add other-host adapters **only** for tools the team actually uses (Cursor does not need `GEMINI.md`)
- [ ] If Claude Code is used, `CLAUDE.md` starts with `@AGENTS.md`
- [ ] If Cursor needs scoped rules, `.cursor/rules/` exists
- [ ] If Copilot is used, `.github/copilot-instructions.md` exists
- [ ] If Gemini CLI is used, `GEMINI.md` and/or `.gemini/settings.json`
- [ ] If Grok is used, `AGENTS.md` (+ optional skill); verify with `grok inspect`
- [ ] If Windsurf is used, `.devin/rules/` or confirm `AGENTS.md` alone is enough
- [ ] If Cline is used, `.clinerules` stays thin
- [ ] Local override files are in `.gitignore`
