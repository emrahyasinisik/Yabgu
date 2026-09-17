# Claude Code

Claude Code loads `CLAUDE.md` at session start. **It does not read `AGENTS.md` on its own.**

## Files to use

| File | Scope | Commit? |
| --- | --- | --- |
| `./CLAUDE.md` or `./.claude/CLAUDE.md` | Project (team) | Yes |
| `./CLAUDE.local.md` | This machine + this repo | No |
| `~/.claude/CLAUDE.md` | All projects, you only | No (home) |
| `.claude/rules/*.md` | Topic or path-scoped rules | Yes |
| `.claude/skills/<name>/SKILL.md` | Task skill | Yes |
| Nested `CLAUDE.md` (subfolder) | Work in that folder | Yes |

Managed / org files also exist (IT policy); not needed for a normal project.

## Claude + AGENTS.md bridge

To share with other agents, put this in `CLAUDE.md`:

```markdown
@AGENTS.md

## Claude Code

Use plan mode first for large changes.
```

`@path` imports expand at session start (up to 4 hops). On Windows, use imports instead of symlinks.

`/init` can generate `CLAUDE.md` from existing Cursor / Copilot rules. With `CLAUDE_CODE_NEW_INIT=1` it also reads `AGENTS.md`, Windsurf, Cline, and Devin rules.

## Writing

- Target: ~200 lines per file
- Be concrete: "2 space indent", "`npm test` before commit"
- Do not leave conflicting rules
- HTML comments (`<!-- -->`) do not enter Claude context; use them for human notes

## `.claude/rules/`

```text
.claude/rules/testing.md
.claude/rules/frontend/react.md
```

All `.md` files are found recursively. For path-scoped rules, put frontmatter at the top of the file (`paths` / globs depending on Claude version); see the current memory docs for details.

Make long procedures that are not needed every time into skills, not rules.

## Skills

```text
.claude/skills/deploy/SKILL.md
```

A skill differs from a rule: it is not embedded in every session; it loads for the relevant task.

## Auto memory

Claude accumulates notes from its own corrections. You do not write these. Put mandatory "always do this" rules in `CLAUDE.md` or a rule file anyway; memory is context, not a lock.

## Check

In a session, `/context` → Memory files should list `CLAUDE.md`.

Writing (200 lines, concrete rules, hook = lock): [how-to-write.md](../docs/how-to-write.md)

## Source

- https://code.claude.com/docs/en/memory
- https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
