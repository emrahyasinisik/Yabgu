# Windsurf

Windsurf, Cursor'a benzer şekilde legacy tek dosyadan kural dizinine geçti.

## Kullanılacak dosyalar

| Dosya | Durum |
| --- | --- |
| `.windsurf/rules/*.md` | Güncel |
| `AGENTS.md` | Birçok ajan gibi desteklenir |
| `.windsurfrules` | Eski; yeni projede yazma |

Kural dosyaları markdown. Windsurf UI'dan kural tipi (always / glob / manual) atanır.

Şablon: [`templates/windsurf/style.md`](../templates/windsurf/style.md)

Claude Code `/init` (yeni init flag ile) `.windsurf/rules/` veya `.windsurfrules` okuyup `CLAUDE.md` üretebilir. Bu tek seferlik kopyadır; sonra senkron tutulmaz. Paylaşılan kaynak yine `AGENTS.md` olsun.
