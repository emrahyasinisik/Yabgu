# Tek kaynak: AGENTS.md + adaptörler

Amaç daha az token ve daha doğru ajan: aynı kuralı üç dosyaya yapıştırma. Bir `AGENTS.md` yaz, diğer araçları ona bağla. Her kopya hem bağlamı şişirir hem çelişince yanlış kod üretir.

## 1. Ortak dosyayı yaz

Kökte `AGENTS.md` oluştur. Şablon: [`templates/AGENTS.md`](../templates/AGENTS.md)

İçine koy:

- Proje özeti (2–4 cümle)
- Kurulum / çalıştırma / test komutları
- Stil ve mimari kuralları
- "Asla yapma" listesi
- PR / commit beklentileri

İçine koyma:

- Uzun prosedürler → `SKILL.md`
- Tek bir araca özel UI/mod notları → native dosya
- Kişisel sandbox URL'leri → `*.local.md` / `AGENTS.override.md`

## 2. Claude Code

Claude `AGENTS.md`'yi kendiliğinden okumaz. Kökte:

```markdown
@AGENTS.md

## Claude Code

Plan mode kullan: büyük refaktörlerde önce plan.
```

Windows'ta symlink yerine `@AGENTS.md` import kullan.

## 3. Cursor

Cursor hem `AGENTS.md` hem `.cursor/rules/*.mdc` okur.

- Genel kurallar → `AGENTS.md`
- "Sadece `**/*.ts` açıkken" gibi scoped kurallar → `.mdc`
- Eski `.cursorrules` kullanma; yeni projede `.cursor/rules/`

## 4. Codex / ChatGPT coding agent

Başka dosya gerekmez. `AGENTS.md` yeter.

Yerel ezme için (commit etme):

```text
AGENTS.override.md
```

veya global:

```text
~/.codex/AGENTS.md
```

## 5. Copilot

İki katman kullan:

1. `AGENTS.md` — ajan talimatı
2. `.github/copilot-instructions.md` — kısa repo özeti (Copilot Chat / review)

Path-specific için `.github/instructions/*.instructions.md` ve `applyTo` frontmatter.

## 6. Gemini CLI

`GEMINI.md` yaz. Gemini `@` import genişletmez; ya içeriği kopyala ya da ayarla:

```json
{
  "context": {
    "fileName": ["AGENTS.md", "GEMINI.md"]
  }
}
```

Bu ayar `.gemini/settings.json` içinde tutulur.

## 7. Gitignore

Kişisel dosyaları commit etme:

```gitignore
CLAUDE.local.md
AGENTS.override.md
*.local.md
```

## Kontrol listesi

Yeni bir projede:

- [ ] `AGENTS.md` var
- [ ] Claude kullanılıyorsa `CLAUDE.md` `@AGENTS.md` ile başlıyor
- [ ] Cursor scoped kural ihtiyacı varsa `.cursor/rules/`
- [ ] Copilot kullanılıyorsa `.github/copilot-instructions.md`
- [ ] Gemini kullanılıyorsa `GEMINI.md` veya `context.fileName`
- [ ] Local override dosyaları `.gitignore`'da
