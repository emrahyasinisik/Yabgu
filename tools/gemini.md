# Gemini CLI

Default context file: **`GEMINI.md`**

This is **Gemini CLI**, not “the Gemini model inside Cursor”. Cursor sessions should not create this file unless the team also uses Gemini CLI.

## Files to use

| File | Scope |
| --- | --- |
| `~/.gemini/GEMINI.md` | All projects |
| `./GEMINI.md` | Repo |
| `src/GEMINI.md` (and other subfolders) | JIT / hierarchical |
| `.gemini/settings.json` | To use `AGENTS.md` as the filename |

The CLI merges found files and appends them to every prompt.

Order (summary):

1. Global `~/.gemini/GEMINI.md`
2. `GEMINI.md` in the workspace and parent folders
3. JIT `GEMINI.md` in a tree when a tool touches a file there

Check: `/memory show`  
Reload from disk: `/memory refresh` (official CLI command name)

## Sharing with AGENTS.md

Gemini does not expand `@AGENTS.md` imports the way Claude does. Two options:

**A. Settings (recommended, single source)**

`.gemini/settings.json`:

```json
{
  "context": {
    "fileName": ["AGENTS.md", "GEMINI.md"]
  }
}
```

**B. Short GEMINI.md**

Write 10–20 Gemini-specific lines; leave shared rules in `AGENTS.md` and tell the team to use path A.

Templates: [`templates/GEMINI.md`](../templates/GEMINI.md) · [`templates/gemini/settings.json`](../templates/gemini/settings.json)

Write negative rules (“Do not…”). Prompt `@path` injects file contents into the query (not a Claude-style `@AGENTS.md` expand inside `GEMINI.md`). Prefer `context.fileName` for a shared `AGENTS.md`. Nested/imported context still costs tokens — shorten or move to a subtree for savings. [how-to-write.md](../docs/how-to-write.md)

## Source

- https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md
