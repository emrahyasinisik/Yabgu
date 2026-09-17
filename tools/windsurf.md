# Windsurf / Cascade (Devin Desktop)

Workspace rules are markdown. Official: [Memories & Rules](https://docs.windsurf.com/windsurf/cascade/memories) (Devin Desktop docs).

## Files to use

| File | Status |
| --- | --- |
| `.devin/rules/*.md` | **Preferred** workspace rules |
| `.windsurf/rules/*.md` | Legacy fallback (still read) |
| `AGENTS.md` | Root = always-on; subdirectory = glob for that path |
| `.windsurfrules` | Legacy single file; do not write in new projects |
| `~/.codeium/windsurf/memories/global_rules.md` | Global; always on; ~6 000 characters |

Workspace rules are ~12 000 characters per file.

## Activation (`trigger` frontmatter)

| `trigger` | When it loads |
| --- | --- |
| `always_on` | Every message |
| `glob` | When `globs:` matches |
| `model_decision` | Description always; content when needed |
| `manual` | Via `@rule-name` |

Example:

```markdown
---
trigger: glob
globs: **/*.test.ts
---

Use describe/it; mock network at the boundary.
```

Template: [`templates/windsurf/style.md`](../templates/windsurf/style.md) → `.devin/rules/style.md` (or `.windsurf/rules/`).

Keep shared commands / architecture in `AGENTS.md`. Put only Windsurf-specific notes in Cascade rules.

Claude Code `/init` (with the new init flag) can read `.windsurf/rules/` or `.windsurfrules` and generate `CLAUDE.md` — a one-time copy; it is not kept in sync afterward.

## MCP

`yabgu_host_setup` host=`windsurf` · [Cascade MCP](https://docs.devin.ai/windsurf/plugins/cascade/mcp)
