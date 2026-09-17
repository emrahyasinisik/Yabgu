# Cline, Roo ve diğer ajanlar

Grok Build ayrı rehber: [`tools/grok.md`](grok.md).

## Cline / Roo Code

| Dosya | Not |
| --- | --- |
| `.clinerules` | Tek dosya (şablon: [`templates/cline/clinerules.md`](../templates/cline/clinerules.md)) |
| `.clinerules/*.md` | Klasör; birden fazla kural |
| `AGENTS.md` | Destek ekleniyor / sürüme bak — paylaşılmış kaynak yine burada |
| `.cursorrules`, `.windsurfrules` | Bazı sürümler fallback okur; yeni projede yazma |

Kök `AGENTS.md` yaz; `.clinerules` içine yalnızca Cline/Roo’ya özel not koy. Aynı uzun metni kopyalama.

MCP: `yabgu_host_setup` host=`cline` · [hosts.md](../docs/hosts.md)

## Devin

`.devin/rules/` — Cascade / Devin Desktop workspace kuralları (eski `.windsurf/rules/` fallback). Claude `/init` bunu da tarayabilir. Windsurf rehberi: [`tools/windsurf.md`](windsurf.md).

## Aider

`AGENTS.md` okuması için `.aider.conf.yml`:

```yaml
read: AGENTS.md
```

Eski alışkanlık: `CONVENTIONS.md`. Yeni projede `AGENTS.md`.

## OpenCode

Kök `AGENTS.md` + `opencode.json` (MCP şeması Cursor’dan farklı). Snippet: `yabgu_host_setup` host=`opencode`. Docs: [Config](https://opencode.ai/docs/config/).

## Amp, Factory, Jules, Goose, Zed, Warp, Kilo

Bunlar [agents.md](https://agents.md/) ekosistemine dahil. Kök `AGENTS.md` birincil dosyadır.

Gemini / Jules için Google tarafında `GEMINI.md` de görülebilir; Jules ajanı `AGENTS.md` listesinde.

## Continue.dev

`.continue/` altında YAML/JSON config + rules. `AGENTS.md` native birincil dosya değildir; kuralları Continue formatında tut veya AGENTS.md’ye pointer koy.

## ChatGPT web

Repo `.md` otomatik yüklenmez. Yapıştırma şablonu: [`templates/chatgpt/web-instructions.md`](../templates/chatgpt/web-instructions.md). Codex kullanıyorsan dosya yeter.

## Özet kural

Listede emin değilsen:

1. `AGENTS.md` koy
2. Araç dokümanında native ad varsa ince adaptör ekle
3. Üç kopya tutma
