# Cline, Roo ve diğer ajanlar

## Cline / Roo Code

| Dosya | Not |
| --- | --- |
| `.clinerules` | Tek dosya |
| `.clinerules/` | Klasör, birden fazla kural |
| `AGENTS.md` | Destek ekleniyor / sürüme bak |
| `.cursorrules`, `.windsurfrules` | Bazı sürümler fallback okur |

Yeni paylaşılan kurulumda kök `AGENTS.md` yaz; Cline native kurallarına sadece Cline'a özel not koy.

## Devin

`.devin/rules/` — Claude `/init` bunu da tarayabilir.

## Aider

`AGENTS.md` okuması için `.aider.conf.yml`:

```yaml
read: AGENTS.md
```

Eski alışkanlık: `CONVENTIONS.md`. Yeni projede `AGENTS.md`.

## Grok Build

Kök `AGENTS.md`. Skills, hooks, MCP. Büyük işte plan mode. Yüklü talimatı görmek için `grok inspect`.

Yazım diğer `AGENTS.md` okuyanlarla aynı: kısa, komut, yasak. [how-to-write.md](../docs/how-to-write.md)

## Amp, Factory, Jules, Goose, OpenCode, Zed, Warp, Kilo

Bunlar [agents.md](https://agents.md/) ekosistemine dahil. Kök `AGENTS.md` birincil dosyadır.

Gemini / Jules için Google tarafında `GEMINI.md` de görülebilir; Jules ajanı `AGENTS.md` listesinde.

## Continue.dev

`.continue/` altında YAML/JSON config + rules. `AGENTS.md` native birincil dosya değildir; kuralları Continue formatında tut veya AGENTS.md'ye pointer koy.

## Özet kural

Listede emin değilsen:

1. `AGENTS.md` koy
2. Araç dokümanında native ad varsa ince adaptör ekle
3. Üç kopya tutma
