# History

Short timeline of what shipped on `main` before the public release. English summary; commit messages are the source of truth (`git log`).

## Timeline

```mermaid
timeline
  title Yabgu on main
  section 2026-09-16
    Catalog : d48c63d Catalog of instruction files + templates
    Rename  : 09982b3 Rename to yabgu + purpose
    Research: 8049d2c Official host research · MCP stays local
  section 2026-09-17
    MCP     : c03e2e1 scan / plan / apply / measure
    Catalog : 813043f Grok + templates + example before state
    Hosts   : 76ea7fd Gemini / Windsurf / others guides
    Tools   : 9ca3176 conflicts + forge_skill
```

## Commits (oldest → newest)

| SHA | Date | Summary |
| --- | --- | --- |
| [`d48c63d`](https://github.com/emrahyasinisik/Yabgu/commit/d48c63d) | 2026-09-16 | Catalog of which files Cursor, Claude, Codex, Copilot, and others load, plus copy-paste templates |
| [`09982b3`](https://github.com/emrahyasinisik/Yabgu/commit/09982b3) | 2026-09-16 | Rename to **yabgu**; Old Turkic metaphor and purpose up front |
| [`8049d2c`](https://github.com/emrahyasinisik/Yabgu/commit/8049d2c) | 2026-09-16 | Official host research; future MCP constrained to local-only |
| [`c03e2e1`](https://github.com/emrahyasinisik/Yabgu/commit/c03e2e1) | 2026-09-17 | Local stdio MCP: scan / plan / apply / measure, elicitation & read-only guards, README |
| [`813043f`](https://github.com/emrahyasinisik/Yabgu/commit/813043f) | 2026-09-17 | Grok guide, native templates, clean example “before” state; Windsurf `.devin/rules` alignment |
| [`76ea7fd`](https://github.com/emrahyasinisik/Yabgu/commit/76ea7fd) | 2026-09-17 | Gemini, Windsurf, and others host guides matched to templates |
| [`9ca3176`](https://github.com/emrahyasinisik/Yabgu/commit/9ca3176) | 2026-09-17 | Conflict radar + skill forge (`yabgu_conflicts`, `yabgu_forge_skill`) |

## Architecture (product layers)

```mermaid
flowchart TB
  subgraph catalog [Catalog — always useful]
    M[docs/matrix + tools/*]
    T[templates/*]
    W[docs/how-to-write]
  end
  subgraph mcp [Local MCP — stdio]
    S[scan]
    P[plan]
    A[apply after approval]
    H[measure · conflicts · forge]
  end
  subgraph host [Host IDE / CLI]
    R[Loads AGENTS.md / adapters / skills]
  end
  catalog --> mcp
  mcp -->|writes instruction paths only| host
  host -.->|never uploads repo to a yabgu server| mcp
```

## Stack map (what each layer owns)

| Layer | Owns | Does not own |
| --- | --- | --- |
| Catalog | Filenames, limits, writing rules, starters | How the model speaks |
| MCP | Scan/plan drafts, apply, health/conflicts/forge | Remote SaaS analysis |
| Host | Loading files into context each turn | Yabgu’s privacy boundary |

## Suggested GitHub metadata (when opening the repo)

Use these in the GitHub UI (Settings → General) if the CLI is unavailable:

- **Description:** `Short instruction files for coding agents — catalog, templates, and a local stdio MCP`
- **Topics:** `mcp` · `agents` · `agents-md` · `cursor` · `claude-code` · `codex` · `github-copilot` · `gemini-cli` · `instruction-files`
- **Website:** leave empty or point at this README

## Notes for consumers

- License: MIT
- Package name: `yabgu` (`npm` publish is optional and separate from GitHub visibility)
- Node `>=18`
- Default branch: `main`
