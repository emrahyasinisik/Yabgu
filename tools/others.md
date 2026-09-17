# Cline, Roo, and other agents

Grok Build has its own guide: [`tools/grok.md`](grok.md).

## Cline / Roo Code

| File | Note |
| --- | --- |
| `.clinerules` | Single file (template: [`templates/cline/clinerules.md`](../templates/cline/clinerules.md)) |
| `.clinerules/*.md` | Folder; multiple rules |
| `AGENTS.md` | Support is being added / check your version — shared source still lives here |
| `.cursorrules`, `.windsurfrules` | Some versions read these as fallback; do not write in new projects |

Write root `AGENTS.md`; put only Cline/Roo-specific notes in `.clinerules`. Do not copy the same long text.

MCP: `yabgu_host_setup` host=`cline` · [hosts.md](../docs/hosts.md)

## Devin

`.devin/rules/` — Cascade / Devin Desktop workspace rules (legacy `.windsurf/rules/` fallback). Claude `/init` can scan this too. Windsurf guide: [`tools/windsurf.md`](windsurf.md).

## Aider

To have Aider read `AGENTS.md`, in `.aider.conf.yml`:

```yaml
read: AGENTS.md
```

Older habit: `CONVENTIONS.md`. Use `AGENTS.md` in new projects.

## OpenCode

Root `AGENTS.md` + `opencode.json` (MCP schema differs from Cursor). Snippet: `yabgu_host_setup` host=`opencode`. Docs: [Config](https://opencode.ai/docs/config/).

## Amp, Factory, Jules, Goose, Zed, Warp, Kilo

These are part of the [agents.md](https://agents.md/) ecosystem. Root `AGENTS.md` is the primary file.

For Gemini / Jules, `GEMINI.md` may also appear on the Google side; the Jules agent is on the `AGENTS.md` list.

## Continue.dev

YAML/JSON config + rules under `.continue/`. `AGENTS.md` is not the native primary file; keep rules in Continue format or point at AGENTS.md.

## ChatGPT web

Repo `.md` is not loaded automatically. Paste template: [`templates/chatgpt/web-instructions.md`](../templates/chatgpt/web-instructions.md). If you use Codex, the file is enough.

## Rule of thumb

If you are unsure for a tool on the list:

1. Put `AGENTS.md`
2. If the tool docs name a native file, add a thin adapter
3. Do not keep three copies
