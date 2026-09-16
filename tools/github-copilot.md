# GitHub Copilot

Copilot hem kendi native dosyalarını hem `AGENTS.md`'yi okur. Hangi yüzeyin ne okuduğu özellikten özelliğe değişir; repo kurulumunda ikisini birden bulundurmak en güvenlisi.

## Kullanılacak dosyalar

| Dosya | Kapsam |
| --- | --- |
| `.github/copilot-instructions.md` | Repo geneli (Chat, review, coding agent, CLI) |
| `.github/instructions/**/*.instructions.md` | Path-specific (`applyTo` glob) |
| `AGENTS.md` | Ajan talimatı (kök + nested) |
| `CLAUDE.md` / `GEMINI.md` | Bazı Copilot yüzeyleri (CLI, coding agent, review) kök dosyayı da okur |
| `~/.copilot/copilot-instructions.md` | Copilot CLI, kullanıcı geneli |
| `~/.copilot/instructions/**/*.instructions.md` | Copilot CLI, modüler kişisel |

## Repo geneli

```markdown
# Copilot instructions

- Stack: ...
- Test: `npm test`
- PR: küçük diff, test ekle
```

Kısa tut. Uzun ortak kurallar `AGENTS.md`'de kalsın; bu dosyada Copilot'un her ipucunda ihtiyaç duyduğu özet dursun.

## Path-specific

Dosya adı `*.instructions.md` ile bitmeli.

```markdown
---
applyTo: "src/frontend/**/*.{ts,tsx}"
---

Bu klasörde React Server Components kullan.
```

İsteğe bağlı `excludeAgent`: `"code-review"` veya `"cloud-agent"`.

## AGENTS.md ile ilişki

Copilot nested `AGENTS.md` destekler; çalışma dizinine en yakın dosya öne çıkar. Cursor/Codex ile paylaşmak için kök `AGENTS.md` yeterli; Copilot Chat için ayrıca `.github/copilot-instructions.md` ekle.

Copilot CLI, `AGENTS.md` / `CLAUDE.md` içinde `@relative/path` import genişletir. `GEMINI.md` ve `*.instructions.md` içinde genişletmez.

## ChatGPT vs Copilot

GitHub Copilot ≠ ChatGPT web. Copilot dosyaları GitHub/VS Code/CLI içindir. ChatGPT web bunları okumaz.

## Kaynak

- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- https://docs.github.com/en/copilot/reference/custom-instructions-support
