# Testing conventions

Load this as `.claude/rules/testing.md`.

- New behavior needs a test in the same change.
- Run the nearest package test command before finishing.
- Do not snapshot huge trees; assert the behavior.
- Mock network at the boundary, not inside domain logic.
