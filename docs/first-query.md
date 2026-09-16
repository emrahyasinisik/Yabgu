# First query (paste into Cursor, Claude, Codex, Copilot, Gemini, or Grok)

Prefer the MCP prompt `yabgu_setup` when the server is connected. Otherwise paste:

```text
Analyze this repository and add only the missing instruction files a coding agent needs: a short AGENTS.md (commands, layout, concrete do-nots), a CLAUDE.md that only imports @AGENTS.md if we might use Claude Code, Cursor .mdc rules only for real glob-scoped conventions, skills only for repeatable multi-step workflows, Copilot files only if this repo uses Copilot.

If Yabgu MCP is available: yabgu_measure → yabgu_scan → yabgu_plan → show drafts → wait for my approval → yabgu_apply (host may show a confirm dialog; otherwise confirmed=true) → yabgu_measure again. Omit `root` unless you must target another folder.

Do not overwrite existing non-empty files. Do not add tone or "how to talk" rules. Do not switch models. Do not duplicate the same rules into every tool file. Then continue with my original request.
```

Before/after protocol: [measure.md](measure.md).
