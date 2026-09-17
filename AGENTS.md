# yabgu

Yabgu is an Old Turkic title: the ruler who carries out the khagan's work. This repo is that layer for coding agents — short instruction files, not the model itself.

Purpose: better project context and fewer tokens. Do not control how the model speaks to the user.

Catalog + templates remain the product core. The MCP is local stdio: guide content, scan/plan, apply only after explicit approval, and measure before/after. Designed from host MCP docs (Cursor, Claude Code, Codex, Copilot, Gemini, Grok).

## Commands

```bash
npm install
npm run build
npm test
npm run typecheck
npx yabgu mcp
npx yabgu measure <path>
npx yabgu conflicts <path>
npx yabgu forge <path>
# published package: npm i -g @emrahyasinisik/yabgu  →  same `yabgu` bin
```

## Layout

- `README.md` — purpose, file matrix, how to copy templates
- `docs/` — product rule, writing guide, host/MCP research, comparison matrix, measure protocol, history
- `tools/` — per-product file lists
- `templates/` — copy-paste starter files
- `fixtures/` — tiny repos for unit tests
- `examples/test-project/` — consumer-style real-test app (acme-dashboard)
- `scripts/` — example:setup / example:reset
- `src/` — MCP + scan/plan/apply/measure
- `test/` — node:test suites

## Style

- Lead with the outcome (accuracy + lower tokens), then the filenames.
- Keep tool guides factual and short. Cite vendor docs when a limit is numeric (200 lines, 32 KiB).
- Templates stay in English; catalog copy may be Turkish.
- Do not invent filenames. If a loader is version-specific, say so.
- Writing rules for instruction files live in `docs/how-to-write.md`. Follow them in templates.

## Do not

- Do not send repo contents, paths, or telemetry to any yabgu-operated server. Local stdio only by default.
- Do not overwrite non-empty instruction files unless the user explicitly asks (`overwrite`).
- Do not add communication, tone, or “how to talk to the user” rules. That is out of scope.
- Do not duplicate the same long rule set in every adapter file (that wastes tokens and causes conflicts).
- Do not put multi-step procedures in always-on files; use skills.
- Do not commit `CLAUDE.local.md` or `AGENTS.override.md`.
- Do not claim a numeric token savings figure without a measured before/after ([docs/measure.md](docs/measure.md)).
