# yabgu

**Yabgu**, Göktürk unvanıdır: kağanın yanında işi yürüten yönetici. Bu repoda model kağan değil; kısa talimat dosyaları yabgudur.

**Amaç:** Cursor, Claude, ChatGPT/Codex ve benzeri ajanları **daha doğru**, **daha etkili** ve **daha az token** ile kullanmak.

Bunu model değiştirerek değil, her turda yüklenen talimatı düzeltmekle yaparız:

- Doğru dosya, doğru araçta (Claude `CLAUDE.md`, Cursor `AGENTS.md` + rules, Codex `AGENTS.md`)
- Ortak kural **bir kez** yazılır, kopyalanmaz
- Kısa tutulur; uzun prosedür skill’e gider, her sohbete gömülmez
- Çelişen / ölü kurallar silinir — yanlış kural hem hata üretir hem token yakar

## Neden token düşer, doğruluk artar

Ajan her mesajda senin anlattığın stack’i, test komutunu ve “yapma” listesini yeniden keşfetmez. Keşif turları (yanlış klasör, yanlış paket yöneticisi, aynı kuralı 4 dosyada çelişik okumak) en pahalı kısımdır.

| Yapılan hata | Sonuç |
| --- | --- |
| Aynı metni `CLAUDE.md` + `AGENTS.md` + Copilot’a yapıştırmak | Token × araç sayısı, çelişince yanlış kod |
| 800 satırlık her-oturum kuralı | Her turda bağlam şişer, kural da uyulmaz |
| Hiç dosya olmaması | Ajan her seferinde repo’yu tarar, uydurur |
| ChatGPT web’den repo md beklemek | Dosya yüklenmez; talimat ayara yazılmalı |

Doğru düzen: ince `AGENTS.md` + ince adaptör. Ayrıntı: [docs/shared-source-of-truth.md](docs/shared-source-of-truth.md)

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

## Nasıl kullanılır (bugün)

Kurulum yok. Kendi projenize şablon kopyalarsınız.

1. [`templates/AGENTS.md`](templates/AGENTS.md) → repo kökü. Komutlar, stil, “yapma” listesi. Kısa tut.
2. Claude kullanıyorsan [`templates/CLAUDE.md`](templates/CLAUDE.md) → kök. İlk satır `@AGENTS.md`.
3. Cursor’da dosya-tipi kuralı varsa [`templates/cursor/`](templates/cursor/) → `.cursor/rules/`.
4. Copilot varsa [`templates/copilot/copilot-instructions.md`](templates/copilot/copilot-instructions.md) → `.github/copilot-instructions.md` (özet; asıl metin `AGENTS.md`).

Sonraki sohbetlerde ajan bu dosyaları kendisi yükler. Aynı şeyi her prompt’ta tekrarlamazsınız.

## Önerilen repo düzeni

Tek kaynak + ince adaptörler:

```text
your-project/
├── AGENTS.md                          # herkes için ortak talimat
├── CLAUDE.md                          # @AGENTS.md + Claude'a özel notlar
├── GEMINI.md                          # kısa Gemini notu veya ayarla AGENTS.md
├── .cursor/rules/                     # Cursor'a özel scoped kurallar
│   └── typescript.mdc
├── .cursor/skills/review-pr/SKILL.md  # görev bazlı skill (her tura girmez)
├── .claude/rules/                     # Claude path-scoped kurallar
├── .claude/skills/                    # Claude skill'leri
└── .github/
    ├── copilot-instructions.md        # Copilot özeti
    └── instructions/
        └── frontend.instructions.md
```

## Araç rehberleri

- [Cursor](tools/cursor.md)
- [Claude Code](tools/claude.md)
- [ChatGPT / Codex](tools/chatgpt-codex.md)
- [GitHub Copilot](tools/github-copilot.md)
- [Gemini CLI](tools/gemini.md)
- [Windsurf](tools/windsurf.md)
- [Cline, Roo, diğerleri](tools/others.md)

## Şablonlar

| Şablon | Ne için |
| --- | --- |
| [`templates/AGENTS.md`](templates/AGENTS.md) | Ortak kaynak |
| [`templates/CLAUDE.md`](templates/CLAUDE.md) | Claude adaptörü |
| [`templates/GEMINI.md`](templates/GEMINI.md) | Gemini CLI |
| [`templates/cursor/always-apply.mdc`](templates/cursor/always-apply.mdc) | Cursor her oturum kuralı |
| [`templates/cursor/glob-rule.mdc`](templates/cursor/glob-rule.mdc) | Cursor dosya deseni kuralı |
| [`templates/copilot/copilot-instructions.md`](templates/copilot/copilot-instructions.md) | Copilot repo özeti |
| [`templates/copilot/path-specific.instructions.md`](templates/copilot/path-specific.instructions.md) | Copilot glob kuralı |
| [`templates/claude/testing.md`](templates/claude/testing.md) | `.claude/rules/` örneği |
| [`templates/skills/SKILL.md`](templates/skills/SKILL.md) | Agent Skill |
| [`templates/windsurf/style.md`](templates/windsurf/style.md) | Windsurf kuralı |

## Ne nereye yazılır?

| İçerik | Dosya |
| --- | --- |
| Build / test / stil / mimari (her araç) | `AGENTS.md` |
| Claude `@` import, plan mode | `CLAUDE.md` |
| Cursor glob / alwaysApply | `.cursor/rules/*.mdc` |
| Görev bazlı uzun prosedür | `SKILL.md` (her tura girmez → token tasarrufu) |
| Kişisel, commit edilmeyecek not | `CLAUDE.local.md` veya `AGENTS.override.md` |
| Copilot path-specific | `.github/instructions/*.instructions.md` |

Hedef: `AGENTS.md` ~200 satırın altında. Şişerse kural veya skill’e böl.

## Bu repo ne değil

- Model seçici / Auto router değil (onu Cursor ve Claude yapar)
- ChatGPT web’e gizli dosya enjekte etmez
- Kurunca sihirli tasarruf garantisi vermez; tasarruf, tekrar keşif ve kopyalanmış kuralların kesilmesinden gelir

## Kaynaklar

- [AGENTS.md](https://agents.md/)
- [Claude Code memory](https://code.claude.com/docs/en/memory)
- [Cursor rules](https://cursor.com/docs/rules)
- [Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [GitHub Copilot custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
- [Gemini CLI GEMINI.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md)
