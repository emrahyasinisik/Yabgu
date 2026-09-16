# agent-md-kit

Yapay zeka kodlama araçları için **hangi markdown dosyasının nerede kullanılacağını** toplayan bir katalog ve şablon kiti.

Farklı araçlar farklı dosya adları okur. Ortak kural:

1. Paylaşılan gerçeği `AGENTS.md` içine yaz.
2. Araç kendi dosyasını okumuyorsa, o dosyadan `AGENTS.md`'ye köprü kur.
3. Sadece o araca özel davranışı native dosyaya koy.

## Hızlı cevap

| Araç | Önce bunları kullan | İsteğe bağlı / native | Okumaz (varsayılan) |
| --- | --- | --- | --- |
| **Cursor** | `AGENTS.md`, `.cursor/rules/*.mdc` | `.cursor/skills/*/SKILL.md` | `CLAUDE.md` |
| **Claude Code** | `CLAUDE.md` veya `.claude/CLAUDE.md` | `.claude/rules/*.md`, `.claude/skills/*/SKILL.md`, `CLAUDE.local.md` | `AGENTS.md` (doğrudan değil) |
| **ChatGPT / Codex** | `AGENTS.md` | `AGENTS.override.md`, `~/.codex/AGENTS.md` | `CLAUDE.md` (doğrudan değil) |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `AGENTS.md` | `.github/instructions/*.instructions.md` | — |
| **Gemini CLI** | `GEMINI.md` | `~/.gemini/GEMINI.md`, ayarla `AGENTS.md` | — |
| **Windsurf** | `.windsurf/rules/*.md` | `AGENTS.md`, eski `.windsurfrules` | — |
| **Cline / Roo** | `.clinerules` veya `.clinerules/` | `AGENTS.md` (destek artıyor) | — |
| **ChatGPT web / Custom GPT** | Ürün içi Instructions alanı | Project instructions | Repodaki `.md` dosyaları otomatik yüklenmez |

Detaylı matris: [docs/matrix.md](docs/matrix.md)

## Önerilen repo düzeni

Tek kaynak + ince adaptörler:

```text
your-project/
├── AGENTS.md                          # herkes için ortak talimat
├── CLAUDE.md                          # @AGENTS.md + Claude'a özel notlar
├── GEMINI.md                          # @AGENTS.md veya kısa özet (Gemini import etmez)
├── .cursor/rules/                     # Cursor'a özel scoped kurallar
│   └── typescript.mdc
├── .cursor/skills/review-pr/SKILL.md  # görev bazlı skill
├── .claude/rules/                     # Claude path-scoped kurallar
├── .claude/skills/                    # Claude skill'leri
└── .github/
    ├── copilot-instructions.md        # Copilot repo geneli
    └── instructions/
        └── frontend.instructions.md   # Copilot path-scoped
```

Adım adım kurulum: [docs/shared-source-of-truth.md](docs/shared-source-of-truth.md)

## Araç rehberleri

- [Cursor](tools/cursor.md)
- [Claude Code](tools/claude.md)
- [ChatGPT / Codex](tools/chatgpt-codex.md)
- [GitHub Copilot](tools/github-copilot.md)
- [Gemini CLI](tools/gemini.md)
- [Windsurf](tools/windsurf.md)
- [Cline, Roo, diğerleri](tools/others.md)

## Şablonlar

Kopyala-yapıştır başlangıç dosyaları [`templates/`](templates/) altında.

| Şablon | Ne için |
| --- | --- |
| [`templates/AGENTS.md`](templates/AGENTS.md) | Ortak kaynak |
| [`templates/CLAUDE.md`](templates/CLAUDE.md) | Claude adaptörü |
| [`templates/GEMINI.md`](templates/GEMINI.md) | Gemini CLI |
| [`templates/cursor/always-apply.mdc`](templates/cursor/always-apply.mdc) | Cursor her oturum kuralı |
| [`templates/cursor/glob-rule.mdc`](templates/cursor/glob-rule.mdc) | Cursor dosya deseni kuralı |
| [`templates/copilot/copilot-instructions.md`](templates/copilot/copilot-instructions.md) | Copilot repo kuralı |
| [`templates/copilot/path-specific.instructions.md`](templates/copilot/path-specific.instructions.md) | Copilot glob kuralı |
| [`templates/claude/testing.md`](templates/claude/testing.md) | `.claude/rules/` örneği |
| [`templates/skills/SKILL.md`](templates/skills/SKILL.md) | Agent Skill |
| [`templates/windsurf/style.md`](templates/windsurf/style.md) | Windsurf kuralı |

## Ne nereye yazılır?

| İçerik | Dosya |
| --- | --- |
| Build / test / stil / mimari (her araç) | `AGENTS.md` |
| Claude `@` import, plan mode, hook notları | `CLAUDE.md` |
| Cursor glob / alwaysApply / description | `.cursor/rules/*.mdc` |
| Görev bazlı uzun prosedür | `SKILL.md` (Cursor veya Claude skills) |
| Kişisel, commit edilmeyecek not | `CLAUDE.local.md` veya `AGENTS.override.md` |
| Copilot path-specific | `.github/instructions/*.instructions.md` |

`AGENTS.md` kısa tut. 200 satırı aşınca konuları kural veya skill dosyalarına böl.

## Kaynaklar

- [AGENTS.md](https://agents.md/)
- [Claude Code memory](https://code.claude.com/docs/en/memory)
- [Cursor rules](https://cursor.com/docs/rules)
- [Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [GitHub Copilot custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
- [Gemini CLI GEMINI.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md)
