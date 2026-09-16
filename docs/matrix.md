# Araç × dosya matrisi

Bu tablo "hangi araç hangi `.md` dosyasını otomatik yükler?" sorusuna cevap verir. Semboller:

- **Evet** — varsayılan olarak okur
- **Ayar** — kullanıcı/proje ayarıyla okur
- **Köprü** — native dosyadan import / symlink gerekir
- **Hayır** — otomatik yüklemez
- **Eski** — hâlâ çalışır, yeni projelerde tercih etme

## Proje kökü dosyaları

| Dosya | Cursor | Claude Code | Codex / ChatGPT | Copilot | Gemini CLI | Windsurf | Cline |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | Evet | Köprü (`@AGENTS.md` veya symlink) | Evet | Evet | Ayar (`context.fileName`) | Evet (çoğu sürüm) | Ayar / evet (sürüme bak) |
| `AGENTS.override.md` | Hayır | Hayır | Evet (aynı dizinde `AGENTS.md`'den önce) | Hayır | Hayır | Hayır | Hayır |
| `CLAUDE.md` | Hayır | Evet | Ayar (`project_doc_fallback_filenames`) | Evet (bazı yüzeyler) | Hayır | Hayır | Hayır |
| `CLAUDE.local.md` | Hayır | Evet (git'e koyma) | Hayır | Hayır | Hayır | Hayır | Hayır |
| `GEMINI.md` | Hayır | Hayır | Hayır | Evet (bazı yüzeyler) | Evet | Hayır | Hayır |
| `.cursorrules` | Eski | `/init` okuyabilir | Hayır | Hayır | Hayır | Hayır | Eski fallback |
| `.windsurfrules` | Hayır | `/init` okuyabilir | Hayır | Hayır | Hayır | Eski | Eski fallback |

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

## Kullanıcı (global) dosyaları

| Yol | Araç |
| --- | --- |
| `~/.cursor/` rules / user rules (Settings) | Cursor |
| `~/.claude/CLAUDE.md` | Claude Code |
| `~/.codex/AGENTS.md` veya `AGENTS.override.md` | Codex |
| `~/.copilot/copilot-instructions.md` | Copilot CLI |
| `~/.gemini/GEMINI.md` | Gemini CLI |

## ChatGPT web

ChatGPT sohbeti (chatgpt.com) repodaki `AGENTS.md` / `CLAUDE.md` dosyalarını **otomatik okumaz**.

| Yüzey | Nerede yazılır |
| --- | --- |
| ChatGPT Custom instructions | Ayarlar → Personalization |
| ChatGPT Projects | Proje talimatları |
| Custom GPT | GPT builder → Instructions |
| Codex / ChatGPT coding agent | Repodaki `AGENTS.md` |

Ayrıntı: [tools/chatgpt-codex.md](../tools/chatgpt-codex.md)
