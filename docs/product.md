# Product rule

Yabgu does **not** control how the agent speaks. Address, language, politeness — that is the host’s job.

## Promise (core)

Without switching models — short instruction files + local MCP to make the agent **more accurate**. This is an **instruction / host-setup standard**, not a new model or Auto.

Lower tokens / bills are the intended **mechanism** (less rediscovery, less always-on bloat), **not a guarantee or %-savings claim.** External story: better instruction setup; savings claims only with a separate measured before/after.

## What we can say vs cannot

| Can say | Cannot say yet |
| --- | --- |
| Setup health is measured (**0–100**); before/after score | “%X token / bill savings” |
| Healthy repos: no needless overwrite; score does not drop (in measured examples) | Sell the measure score as invoice proof |

`yabgu_measure` = setup health. For tokens or bills, run a separate same-prompt before/after → [measure.md](measure.md).

## Order of work

1. **Catalog + templates** — which agent reads which native file, and how to write them (product core; finish / update this first).
2. **MCP (local stdio)** — serves docs/templates; `scan` → `plan` → user approval → `apply`; `measure` for before/after. Derived from the catalog; does not replace native files.
3. Install using official host schemas in [docs/hosts.md](hosts.md) — CLI `yabgu setup <host>` (or MCP `yabgu_host_setup` after connect). No guessing.

The MCP does not replace native files. It **proposes / writes after approval**; loading every turn is still the host’s job.

Until first-query + approval UI are solid, “mandatory standard for every team” stays **conditional**; catalog + measurable setup health are the shippable layer.

Conflict radar + skill forge: [docs/conflicts-forge.md](conflicts-forge.md).

## Privacy (MCP)

The project of the person who adds Yabgu stays **only on their machine**. The person who writes / ships Yabgu cannot see, pull, or log that repo.

Therefore the MCP:

- **stdio / local process** — default on Cursor, Claude, Codex, Gemini, Grok. Code does not go to a yabgu server.
- **No phone-home:** repo contents, paths, file lists, telemetry, “first query reports” are not sent to yabgu.
- **No SaaS analysis:** no “upload your project, we generate AGENTS.md”. Scanning is on the user’s disk.
- **Logs:** if any, on the user’s machine; no remote logs.
- **Writes:** only `yabgu_apply` (host form elicitation UI when available; otherwise `confirmed=true`) + optional `overwrite`. Targets only native instruction paths (`AGENTS.md`, thin adapters, skills) — not arbitrary source files.
- **`YABGU_READ_ONLY=1`:** `yabgu_apply` is not registered. For Copilot cloud / read-only installs — this exception is not hidden.

The host’s already-open workspace (Cursor, GitHub, Claude) is a separate matter — that is not access for the yabgu author.

Copilot **cloud** agent MCP runs on GitHub’s infrastructure. Even there yabgu does not send data to a yabgu backend; use a `tools` allowlist + `readOnlyHint` on read-only tools + `YABGU_READ_ONLY=1`. Do not consciously add `yabgu_apply` to the allowlist.

Remote HTTP MCP only if the user points at their own server. Yabgu’s official install does not ship a remote endpoint.
