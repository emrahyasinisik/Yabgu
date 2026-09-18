# Before / after measurement

Yabgu does **not** claim a numeric token or bill savings figure without a measured before/after of tokens/context/bill. `yabgu_measure` is a **setup health** heuristic (0–100), not a invoice proxy.

## What we can say vs cannot

| Can say (after protocol) | Cannot say from measure alone |
| --- | --- |
| Setup health improved (e.g. score went from low → high) | “%X cheaper tokens / lower bill” |
| Healthy repos: no needless overwrite; score does not drop | Treat the 0–100 score as invoice proof |

External story: better instruction setup; savings claim only when separately measured. See [product.md](product.md).

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

Do not publish marketing numbers from the heuristic score alone. For token or bill claims, measure host context size or billable tokens separately with the same prompts before and after.
