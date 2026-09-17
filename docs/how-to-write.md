# How models want instructions written

Sources: Anthropic Claude Code, OpenAI Codex, Google Gemini CLI, GitHub Copilot, Cursor, Grok Build, [agents.md](https://agents.md/). Same core advice; file names differ.

Yabgu’s job is to put that core into `AGENTS.md` — not copy-paste it everywhere or bloat it.

## Shared core (everyone)

| Rule | Why | Who says so |
| --- | --- | --- |
| Keep it short | Every line costs tokens every turn. Long files are **followed less**. | Claude: ~200 lines. Codex: default **32 KiB** combined ceiling. Copilot: sent with every message. Gemini: “every line pays rent.” |
| Write concrete, checkable rules | “Format cleanly” does nothing. | Claude: `2 space`, `npm test` before commit. |
| Spell out bans | Negative rules stick better than vague positives. | Gemini official: “Do not use class components.” |
| Don’t restate what code already says | `.ts` already means TypeScript. | Gemini / localskills summaries |
| Deletion test | If removing the line wouldn’t make the agent fail, cut it. | Anthropic: bloated CLAUDE.md instructions are **ignored** |
| Leave no conflicts | The model picks one side at random. | Claude, Copilot, agents.md |
| Don’t put procedures in every turn | A 30-line runbook is a skill, not memory. | Anthropic steering |
| Don’t enforce “never” with text alone | Text advises. Real locks: hooks, permissions, CI. | Claude: CLAUDE.md ≠ enforcement |
| Write full commands | Agents will try to **run** listed tests. | agents.md, Codex examples |
| Say why in one sentence | A reason increases compliance. | Anthropic prompting |

## What belongs in the root file (agents.md + vendor examples)

Keep at the root:

- 2–4 sentence project overview (decisions code doesn’t show)
- Install / start / test / lint — copy-pasteable commands
- Style and architecture: concrete, with a “do not” list
- Testing: when, how to run a single test
- Security: secrets, `.env`, untouchable paths
- PRs: small diffs, green CI

Leave out of the root:

- README copies
- Framework tutorials (“what is React”)
- Formatting the linter already catches
- Deploy runbooks, release checklists → skill
- Empty lines like “write good code”

## Tool differences (when writing)

**Claude (Opus / Sonnet, Claude Code)**  
`CLAUDE.md` is context, not a lock. ~200 lines. Share via `@AGENTS.md`. Use plan mode for large work. Hooks = hard bans. Nested `CLAUDE.md` loads only when that tree is entered (saves tokens).

**GPT / Codex**  
`AGENTS.md` files are merged; nearer-to-leaf wins later. Same-directory `AGENTS.override.md` overrides `AGENTS.md`. Over 32 KiB → **truncated** — put critical rules at the top and split into nested folders. Code review rules under separate `## Code Review Rules`; leave lint to CI.

**ChatGPT web**  
Repo markdown is not loaded. Paste the same short text into Custom / Project instructions. If you use Codex, the file is enough.

**Gemini**  
`GEMINI.md` is attached to every prompt. Prefer negative rules + hierarchy. `@import` helps maintenance but **does not save tokens** (still inlined). To save tokens, delete or move to a subdirectory. `@AGENTS.md` does not expand like Claude; set `context.fileName`.

**Cursor (Auto / Grok / Claude / GPT — host Cursor)**  
Root `AGENTS.md` every session. Scoped rules: `.mdc` + glob so they are not always-on. Plain `.md` under `.cursor/rules/` is ignored. Skills = task procedures.

**GitHub Copilot**  
Short, self-contained sentences. `copilot-instructions.md` is a summary; long shared text lives in `AGENTS.md`. Path-specific `applyTo`. Don’t stack conflicting personal + repo + org + AGENTS layers.

**Grok Build**  
`AGENTS.md` + skills + hooks. Plan mode for large changes. `grok inspect` shows what loaded.

**Qwen / DeepSeek / open weights (Cline, Continue, OpenCode)**  
Host reads `AGENTS.md` or native rules. On the prompt side: goal, constraints, acceptance, verification. Don’t over-write procedures; that hurts file exploration.

## Writing pattern

Bad:

```markdown
Keep code quality high. Don’t forget to test. Be careful about security.
```

Good:

```markdown
- Install: `pnpm install`
- Test: `pnpm test` (single file: `pnpm vitest run path/to/file.test.ts`)
- Do not edit `src/db/migrations/` without a human in the PR
- Do not use `any`. Prefer `unknown` and narrow.
```

## Practical loop (what the vendors recommend)

Discover → plan → implement → run test/lint. Don’t put that as a manifesto in AGENTS.md; write the **commands** so the agent runs them before finishing.

## Where in this repo

- Template: [`templates/AGENTS.md`](../templates/AGENTS.md)
- Single source: [`shared-source-of-truth.md`](shared-source-of-truth.md)
- File names: [`matrix.md`](matrix.md)
