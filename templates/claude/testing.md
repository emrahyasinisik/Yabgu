---
paths:
  - "**/*.{test,spec}.{ts,tsx,js,jsx}"
  - "**/tests/**"
---

# Testing conventions

Load this as `.claude/rules/testing.md`. Path frontmatter is version-sensitive — confirm against current Claude Code memory docs if the rule does not scope as expected.

- New behavior needs a test in the same change.
- Run the nearest package test command before finishing.
- Do not snapshot huge trees; assert the behavior.
- Mock network at the boundary, not inside domain logic.
