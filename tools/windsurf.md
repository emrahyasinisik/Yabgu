# Windsurf / Cascade (Devin Desktop)

Workspace kuralları markdown. Resmi: [Memories & Rules](https://docs.windsurf.com/windsurf/cascade/memories) (Devin Desktop docs).

## Kullanılacak dosyalar

| Dosya | Durum |
| --- | --- |
| `.devin/rules/*.md` | **Tercih edilen** workspace rules |
| `.windsurf/rules/*.md` | Legacy fallback (hâlâ okunur) |
| `AGENTS.md` | Kök = always-on; alt dizin = o yol için glob |
| `.windsurfrules` | Eski tek dosya; yeni projede yazma |
| `~/.codeium/windsurf/memories/global_rules.md` | Global; her zaman açık; ~6 000 karakter |

Workspace kuralı dosya başına ~12 000 karakter.

## Activation (`trigger` frontmatter)

| `trigger` | Ne zaman yüklenir |
| --- | --- |
| `always_on` | Her mesaj |
| `glob` | `globs:` eşleşince |
| `model_decision` | Açıklama her zaman; içerik gerekince |
| `manual` | `@rule-name` ile |

Örnek:

```markdown
---
trigger: glob
globs: **/*.test.ts
---

Use describe/it; mock network at the boundary.
```

Şablon: [`templates/windsurf/style.md`](../templates/windsurf/style.md) → `.devin/rules/style.md` (veya `.windsurf/rules/`).

Paylaşılan komut / mimari yine `AGENTS.md`. Cascade kuralına yalnızca Windsurf’a özel not koy.

Claude Code `/init` (yeni init flag ile) `.windsurf/rules/` veya `.windsurfrules` okuyup `CLAUDE.md` üretebilir — tek seferlik kopya; sonra senkron tutulmaz.

## MCP

`yabgu_host_setup` host=`windsurf` · [Cascade MCP](https://docs.devin.ai/windsurf/plugins/cascade/mcp)
