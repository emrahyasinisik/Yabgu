# Real test: consumer example

`examples/test-project` is a fake product repo (**acme-dashboard**). It starts **without** instruction files so Yabgu’s before → setup → after loop is meaningful.

## Quick run (from yabgu root)

```bash
# 1) Before
npx yabgu measure examples/test-project

# 2) Apply justified drafts (CLI helper used in CI/dev — or use MCP yabgu_setup in the IDE)
npm run example:setup

# 3) After
npx yabgu measure examples/test-project
```

Or in Cursor with Yabgu MCP connected, open `examples/test-project` and run the **`yabgu_setup`** prompt (approve each file before apply).

## Pass criteria

- After score > before score
- `AGENTS.md` exists, non-empty, under ~200 lines
- Tone-rule hits stay 0
- Existing non-empty files were not overwritten

## Reset

To re-run from a clean before state:

```bash
npm run example:reset
```
