# Gemini CLI instructions

Gemini CLI does not expand `@AGENTS.md` imports. Prefer copying [`templates/gemini/settings.json`](gemini/settings.json) to `.gemini/settings.json` so both `AGENTS.md` and this file load:

```json
{
  "context": {
    "fileName": ["AGENTS.md", "GEMINI.md"]
  }
}
```

With that setting, keep this file to Gemini-only notes.

## Gemini-only

- Prefer `/memory show` when debugging missing context.
- Reload with `/memory reload` after editing context files.
