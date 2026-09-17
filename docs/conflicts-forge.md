# Conflicts + skill forge

Local heuristics. No upload. Neither tool writes disk — fix via review / `yabgu_apply`.

## Conflicts (`yabgu_conflicts` / `yabgu conflicts <path>`)

Finds:

| Signal | Example |
| --- | --- |
| Opposing polarity | AGENTS: “Do not push” · adapter: “Always push” |
| Mismatched commands | AGENTS fence: `npm test` · CLAUDE: `pnpm test` |
| Near-duplicate do-nots | Same ban worded differently across files |

Model picks one side at random when both fire — prefer one polarity in `AGENTS.md`, thin adapters.

## Skill forge (`yabgu_forge_skill` / `yabgu forge <path>`)

| Mode | Use |
| --- | --- |
| `text` | Paste / summarize a chat procedure → draft `SKILL.md` |
| `agents` | Scan always-on files for Deploy/Release/runbook-sized blocks; `pick` to draft one |

Flow: draft → show user → `yabgu_apply` → trim the long section out of `AGENTS.md` (hint in the report). Skills are for multi-step workflows; tone/voice stays out of scope.
