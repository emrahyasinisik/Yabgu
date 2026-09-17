# Grok Build

Grok Build kök `AGENTS.md` okur. Ayrı bir `GROK.md` gerekmez.

## Kullanılacak dosyalar

| Dosya | Not |
| --- | --- |
| `AGENTS.md` | Proje talimatı (birincil) |
| Skills | Görev prosedürü; her tura girmez |
| Hooks | Zorunlu yasak / otomatik kontrol |
| `~/.grok/config.toml` | Kullanıcı MCP / model / plugin |
| `.grok/config.toml` | Proje MCP / plugin / permission (talimat değil) |

Yüklü talimat, skill, hook ve MCP’yi görmek için:

```bash
grok inspect
```

Büyük değişikliklerde plan mode kullan. Yazım: kısa, komut, yasak — [how-to-write.md](../docs/how-to-write.md).

## AGENTS.md ile paylaşım

Cursor / Codex / Copilot ile aynı `AGENTS.md` yeter. Claude kullanıyorsan ayrıca ince `CLAUDE.md` (`@AGENTS.md`); Grok onu okumaz.

Uzun prosedürleri `AGENTS.md`’ye gömme → skill. Konuşma tonu yazma (Yabgu kapsamı dışı).

## MCP

Kurulum snippet: `yabgu_host_setup` host=`grok`.  
Resmi: [MCP servers](https://docs.x.ai/build/features/mcp-servers) · [Grok Build](https://docs.x.ai/build/overview)

Grok ayrıca `~/.claude.json`, `.cursor/mcp.json`, proje `.mcp.json` okuyabilir (compat; kapatılabilir). `npx` soğuk açılışta `startup_timeout_sec` yükselt.

## Kaynak

- https://docs.x.ai/build/overview
- https://docs.x.ai/build/features/mcp-servers
