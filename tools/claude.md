# Claude Code

Claude Code oturum başında `CLAUDE.md` yükler. **`AGENTS.md` dosyasını kendiliğinden okumaz.**

## Kullanılacak dosyalar

| Dosya | Kapsam | Commit? |
| --- | --- | --- |
| `./CLAUDE.md` veya `./.claude/CLAUDE.md` | Proje (takım) | Evet |
| `./CLAUDE.local.md` | Bu makine + bu repo | Hayır |
| `~/.claude/CLAUDE.md` | Tüm projelerin, sadece sen | Hayır (home) |
| `.claude/rules/*.md` | Konu veya path-scoped kurallar | Evet |
| `.claude/skills/<ad>/SKILL.md` | Görev skill'i | Evet |
| Nested `CLAUDE.md` (alt klasör) | O klasördeki iş | Evet |

Managed / org dosyası da vardır (IT politikası); normal projede gerekmez.

## Claude + AGENTS.md köprüsü

Diğer ajanlarla paylaşmak için `CLAUDE.md`:

```markdown
@AGENTS.md

## Claude Code

Büyük değişikliklerde önce plan mode.
```

`@path` import'ları oturum başında genişler (en fazla 4 hop). Windows'ta symlink yerine import kullan.

`/init` mevcut Cursor / Copilot kurallarından `CLAUDE.md` üretebilir. `CLAUDE_CODE_NEW_INIT=1` ile `AGENTS.md`, Windsurf, Cline, Devin kurallarını da okur.

## Yazım

- Hedef: dosya başına ~200 satır
- Somut ol: "2 space indent", "`npm test` commit öncesi"
- Çelişen kural bırakma
- HTML yorumları (`<!-- -->`) Claude context'ine girmez; insan notu için kullan

## `.claude/rules/`

```text
.claude/rules/testing.md
.claude/rules/frontend/react.md
```

Tüm `.md` dosyaları recursive bulunur. Path-scoped kural için dosya başında frontmatter (Claude sürümüne göre `paths` / globs) kullan; ayrıntı için güncel memory dokümanına bak.

Uzun, her seferinde gerekmeyen prosedürleri kural değil skill yap.

## Skills

```text
.claude/skills/deploy/SKILL.md
```

Skill, kuraldan farklıdır: her oturuma gömülmez, ilgili görevde yüklenir.

## Auto memory

Claude kendi düzeltmelerinden not biriktirir. Sen yazmazsın. Zorunlu "her zaman yap" kurallarını yine `CLAUDE.md` veya rule dosyasına koy; memory bağlamdır, kilit değil.

## Kontrol

Oturumda `/context` → Memory files listesinde `CLAUDE.md` görünmeli.

## Kaynak

- https://code.claude.com/docs/en/memory
