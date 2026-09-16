# Araç × dosya matrisi

Bu tablo "hangi araç hangi `.md` dosyasını otomatik yükler?" sorusuna cevap verir. Semboller:

- **Evet** — varsayılan olarak okur
- **Ayar** — kullanıcı/proje ayarıyla okur
- **Köprü** — native dosyadan import / symlink gerekir
- **Hayır** — otomatik yüklemez
- **Eski** — hâlâ çalışır, yeni projelerde tercih etme

## Proje kökü dosyaları

| Dosya | Cursor | Claude Code | Codex | Copilot | Gemini CLI | Grok Build | Windsurf | Cline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | Evet | Köprü (`@AGENTS.md`) | Evet | Evet | Ayar | Evet | Evet | Ayar / evet |
| `AGENTS.override.md` | Hayır | Hayır | Evet | Hayır | Hayır | Hayır | Hayır | Hayır |
| `CLAUDE.md` | Hayır | Evet | Ayar | Evet (bazı yüzeyler) | Hayır | Hayır | Hayır | Hayır |
| `CLAUDE.local.md` | Hayır | Evet (gitignore) | Hayır | Hayır | Hayır | Hayır | Hayır | Hayır |
| `GEMINI.md` | Hayır | Hayır | Hayır | Evet (bazı yüzeyler) | Evet | Hayır | Hayır | Hayır |
| `.cursorrules` | Eski | `/init` okuyabilir | Hayır | Hayır | Hayır | Hayır | Hayır | Eski fallback |
| `.windsurfrules` | Hayır | `/init` okuyabilir | Hayır | Hayır | Hayır | Hayır | Eski | Eski fallback |

## Native kural dizinleri

| Yol | Araç | Ne zaman yüklenir |
| --- | --- | --- |
| `.cursor/rules/*.mdc` | Cursor | `alwaysApply`, glob veya `@` mention |
| `.cursor/skills/*/SKILL.md` | Cursor | İlgili görev / mention |
| `.claude/CLAUDE.md` | Claude Code | `./CLAUDE.md` alternatifi |
| `.claude/rules/*.md` | Claude Code | Her oturum veya path eşleşince |
| `.claude/skills/*/SKILL.md` | Claude Code | Skill tetiklenince |
| `.github/copilot-instructions.md` | GitHub Copilot | Repo geneli |
| `.github/instructions/**/*.instructions.md` | GitHub Copilot | `applyTo` glob |
| `.windsurf/rules/*.md` | Windsurf | Kural ayarına göre |
| `.clinerules` veya `.clinerules/` | Cline / Roo | Proje kuralları |
| `.devin/rules/` | Devin | `/init` (Claude) bunu da okuyabilir |
| `GEMINI.md` / `.gemini/` | Gemini CLI | Proje + `~/.gemini/GEMINI.md` |
| `opencode.json` + `AGENTS.md` | OpenCode | Native config + talimat |

MCP config dosyaları (kurulum sonra; şema tahmini yok): [hosts.md](hosts.md)

## Kullanıcı (global) dosyaları

| Yol | Araç |
| --- | --- |
| `~/.cursor/` rules / user rules (Settings) | Cursor |
| `~/.claude/CLAUDE.md` | Claude Code |
| `~/.codex/AGENTS.md` veya `AGENTS.override.md` | Codex |
| `~/.copilot/copilot-instructions.md` | Copilot CLI |
| `~/.gemini/GEMINI.md` | Gemini CLI |
| `~/.grok/config.toml` | Grok Build (MCP / plugin; talimat değil) |
| `~/.codex/config.toml` | Codex (MCP; talimat `AGENTS.md`) |

## ChatGPT web

ChatGPT sohbeti (chatgpt.com) repodaki `AGENTS.md` / `CLAUDE.md` dosyalarını **otomatik okumaz**.

| Yüzey | Nerede yazılır |
| --- | --- |
| ChatGPT Custom instructions | Ayarlar → Personalization |
| ChatGPT Projects | Proje talimatları |
| Custom GPT | GPT builder → Instructions |
| Codex / ChatGPT coding agent | Repodaki `AGENTS.md` |

Ayrıntı: [tools/chatgpt-codex.md](../tools/chatgpt-codex.md)
