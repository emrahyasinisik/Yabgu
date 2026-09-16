# Before / after measurement

Yabgu does **not** claim a numeric token savings figure without a measured before/after. Use this local heuristic instead.

## Command

```bash
npx yabgu measure /absolute/path/to/consumer-repo
```

Or via MCP: `yabgu_measure` with the same root.

## What it scores

| Signal | Intent |
| --- | --- |
| `AGENTS.md` present and non-empty | Shared source of truth |
| Line count ≤ ~200 | Avoid always-on bloat |
| Adapter files | Thin host files exist when justified |
| Tone-rule hits | Out-of-scope “how to talk” phrases |
| Missing recommended | Usually empty/missing `AGENTS.md` |

Score is **0–100 setup health**, not tokens saved.

## Protocol (3–5 real repos)

1. Pick consumer repos (not only this kit).
2. Run `yabgu measure <repo>` → save JSON/markdown output as **before**.
3. Run setup (`yabgu_setup` prompt or scan → plan → approve → apply).
4. Run `yabgu measure <repo>` again → **after**.
5. Record: score delta, missingRecommended cleared?, toneRuleHits delta, files written.

Do not publish marketing numbers from the heuristic score alone. For token claims, measure host context size or billable tokens separately with the same prompts before and after.
