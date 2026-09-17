# ChatGPT / Codex

The answer to "which md for ChatGPT?" depends on **which product** you mean.

## Codex (ChatGPT coding agent / Codex CLI)

File read automatically in the repo: **`AGENTS.md`**

| File | Where | When |
| --- | --- | --- |
| `AGENTS.md` | Repo root and subfolders | Every run |
| `AGENTS.override.md` | Same directory; preferred over `AGENTS.md` | Local override |
| `~/.codex/AGENTS.md` | User home | All projects |
| `~/.codex/AGENTS.override.md` | Home; replaces `AGENTS.md` if present | Global override |

Discovery order (summary):

1. Global: `~/.codex/AGENTS.override.md`, else `~/.codex/AGENTS.md`
2. From git root toward the working directory, in each folder: `AGENTS.override.md` → `AGENTS.md` → configured fallback names
3. At most one file per folder
4. Merged from root downward; closer to the leaf comes later
5. Default combined limit ~32 KiB (`project_doc_max_bytes`)

`CLAUDE.md` is not on the default list. If you want it, set this at the **top level** of `~/.codex/config.toml`:

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
```

That makes `CLAUDE.md` a fallback candidate in folders without `AGENTS.md`. Putting it under `[project]` does not work. For a shared setup, `AGENTS.md` plus `@AGENTS.md` on the Claude side is more reliable.

## ChatGPT web (chatgpt.com)

Markdown in the repo is **not loaded automatically**.

| Need | Where to write |
| --- | --- |
| All chats | Settings → Personalization → Custom instructions |
| One project | ChatGPT Project → Instructions |
| A single GPT | GPT builder → Instructions |
| Agent on a codebase | Codex + `AGENTS.md` |

There is no "md file" for the web; it is a text settings field. You can copy the same content from `AGENTS.md`, but sync is not automatic.

## Custom GPT / Assistants API

Instructions live in the GPT's Instructions field. You can optionally upload `.md` as Knowledge; that is not the same as automatic project memory in Cursor/Claude.

## What to write

For `AGENTS.md`:

- Setup and test commands
- Repo map
- Style
- Security boundaries
- "Run this before finishing"

Template: [`templates/AGENTS.md`](../templates/AGENTS.md)

Codex truncates the combined instructions at ~32 KiB. Put critical rules at the top of the file and in nested folders. Details: [how-to-write.md](../docs/how-to-write.md)

## Source

- https://developers.openai.com/codex/guides/agents-md
- https://agents.md/
