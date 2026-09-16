# Gemini CLI instructions

Gemini CLI does not expand `@AGENTS.md` imports. Either copy the shared rules here, or set `.gemini/settings.json`:

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
