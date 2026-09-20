# First query (paste into Cursor, Claude, Codex, Copilot, Gemini, or Grok)

**Before MCP is connected:** install with the README JSON blocks or `npx @emrahyasinisik/yabgu setup <host> [--write]` — see [README Setup](../README.md#setup) and [hosts.md](hosts.md).

**After the server is connected:** prefer the MCP prompt `yabgu_setup`. Otherwise paste:

```text
Analyze this repository and add only the missing instruction files this host needs. Cursor: AGENTS.md (and .mdc rules only for real globs). Claude Code: CLAUDE.md that only imports @AGENTS.md. Gemini CLI: GEMINI.md. Copilot files only if this repo uses Copilot. Do not add GEMINI.md because the Cursor model is Gemini.

If Yabgu MCP is available:
1. yabgu_measure → yabgu_scan → yabgu_plan → show drafts → wait for my approval → yabgu_apply (host may show a confirm dialog; otherwise confirmed=true) → yabgu_measure again.
2. If AGENTS.md (or other instruction files) already exist: do not overwrite them; call yabgu_conflicts once and report any clashes before inventing new files.
3. Omit `root` unless you must target another folder.

When you present results: lead with the best practices that apply to this repo right now, then session facts only — do not upsell Copilot/Gemini/Claude adapters unless I asked for those tools.

Do not overwrite existing non-empty files. Do not add tone or "how to talk" rules. Do not switch models. Do not duplicate the same rules into every tool file. Then continue with my original request.
```

Already-setup repos: skip creating files that exist → run `yabgu_conflicts` once → continue the user’s original task. Before/after protocol: [measure.md](measure.md). Conflicts & forge: [conflicts-forge.md](conflicts-forge.md).
