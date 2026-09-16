# ChatGPT / Codex

"ChatGPT için hangi md?" sorusunun cevabı **hangi ürüne** baktığına göre değişir.

## Codex (ChatGPT coding agent / Codex CLI)

Repoda otomatik okunan dosya: **`AGENTS.md`**

| Dosya | Nerede | Ne zaman |
| --- | --- | --- |
| `AGENTS.md` | Repo kökü ve alt klasörler | Her çalışmada |
| `AGENTS.override.md` | Aynı dizin, `AGENTS.md`'den önce tercih edilir | Yerel ezme |
| `~/.codex/AGENTS.md` | Kullanıcı home | Tüm projeler |
| `~/.codex/AGENTS.override.md` | Home, varsa `AGENTS.md` yerine | Global ezme |

Keşif sırası (özet):

1. Global: `~/.codex/AGENTS.override.md` yoksa `~/.codex/AGENTS.md`
2. Git kökünden çalışma dizinine doğru her klasörde: `AGENTS.override.md` → `AGENTS.md` → ayarlı fallback isimleri
3. Klasör başına en fazla bir dosya
4. Kökten aşağı birleştirilir; alta yakın olan sonra gelir
5. Varsayılan birleşik limit ~32 KiB (`project_doc_max_bytes`)

`CLAUDE.md` varsayılan listede yoktur. İstersen `~/.codex/config.toml` içinde **üst seviyede**:

```toml
project_doc_fallback_filenames = ["CLAUDE.md"]
```

Bu, `AGENTS.md` olmayan klasörlerde `CLAUDE.md`'yi yedek aday yapar. `[project]` altına koymak çalışmaz. Paylaşılan kurulum için yine `AGENTS.md` + Claude tarafında `@AGENTS.md` daha güvenilir.

## ChatGPT web (chatgpt.com)

Repodaki markdown **otomatik yüklenmez**.

| İhtiyaç | Nerede yaz |
| --- | --- |
| Tüm sohbetler | Settings → Personalization → Custom instructions |
| Bir proje | ChatGPT Project → Instructions |
| Tek bir GPT | GPT builder → Instructions |
| Kod tabanında ajan | Codex + `AGENTS.md` |

Web için "md dosyası" yok; metin ayar alanıdır. Aynı içeriği `AGENTS.md`'den kopyalayabilirsin ama senkron otomatik değildir.

## Custom GPT / Assistants API

Talimat GPT'nin Instructions alanında durur. İsteğe bağlı Knowledge olarak `.md` yükleyebilirsin; bu, Cursor/Claude'daki otomatik proje belleği değildir.

## Ne yaz

`AGENTS.md` için:

- Kurulum ve test komutları
- Repo haritası
- Stil
- Güvenlik sınırları
- "Bitirmeden önce şunu çalıştır"

Şablon: [`templates/AGENTS.md`](../templates/AGENTS.md)

## Kaynak

- https://developers.openai.com/codex/guides/agents-md
- https://agents.md/
