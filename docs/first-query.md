# First query (paste into Cursor, Claude, Codex, Copilot, Gemini, or Grok)

Prefer the MCP prompt `yabgu_setup` when the server is connected. Otherwise paste:

```text
Analyze this repository and add only the missing instruction files this host needs. Cursor: AGENTS.md (and .mdc rules only for real globs). Claude Code: CLAUDE.md that only imports @AGENTS.md. Gemini CLI: GEMINI.md. Copilot files only if this repo uses Copilot. Do not add GEMINI.md because the Cursor model is Gemini.

If Yabgu MCP is available: yabgu_measure → yabgu_scan → yabgu_plan → show drafts → wait for my approval → yabgu_apply (host may show a confirm dialog; otherwise confirmed=true) → yabgu_measure again. Omit `root` unless you must target another folder.

When you present results: lead with the best practices that apply to this repo right now, then session facts only — do not upsell Copilot/Gemini/Claude adapters unless I asked for those tools.

Do not overwrite existing non-empty files. Do not add tone or "how to talk" rules. Do not switch models. Do not duplicate the same rules into every tool file. Then continue with my original request.
```

Before/after protocol: [measure.md](measure.md).
