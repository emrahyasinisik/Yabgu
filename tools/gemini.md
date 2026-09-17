# Gemini CLI

Varsayılan context dosyası: **`GEMINI.md`**

## Kullanılacak dosyalar

| Dosya | Kapsam |
| --- | --- |
| `~/.gemini/GEMINI.md` | Tüm projeler |
| `./GEMINI.md` | Repo |
| `src/GEMINI.md` (ve diğer alt klasörler) | JIT / hiyerarşik |
| `.gemini/settings.json` | Dosya adını `AGENTS.md` yapmak için |

CLI bulunan dosyaları birleştirip her prompt'a ekler.

Sıra (özet):

1. Global `~/.gemini/GEMINI.md`
2. Workspace ve ebeveyn klasörlerdeki `GEMINI.md`
3. Araç bir dosyaya dokununca o ağaçtaki JIT `GEMINI.md`

Kontrol: `/memory show`  
Yenile: `/memory reload`

## AGENTS.md ile paylaşım

Gemini `@AGENTS.md` import'unu Claude gibi genişletmez. İki yol:

**A. Ayar (önerilen, tek kaynak)**

`.gemini/settings.json`:

```json
{
  "context": {
    "fileName": ["AGENTS.md", "GEMINI.md"]
  }
}
```

**B. Kısa GEMINI.md**

Gemini'ye özel 10–20 satır yaz; ortak kuralları `AGENTS.md`'de bırak ve ekip üyelerine A yolunu söyle.

Şablonlar: [`templates/GEMINI.md`](../templates/GEMINI.md) · [`templates/gemini/settings.json`](../templates/gemini/settings.json)

Negatif kural yaz (“Do not…”). `@import` token düşürmez; düşürmek için sil veya alt klasöre taşı. [how-to-write.md](../docs/how-to-write.md)

## Kaynak

- https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md
