# Cursor

Cursor ajanına proje talimatı vermek için üç katman var. Yeni projelerde `.cursorrules` kullanma.

## Kullanılacak dosyalar

| Dosya | Zorunlu mu? | Ne işe yarar |
| --- | --- | --- |
| `AGENTS.md` | Küçük projelerde yeterli | Düz markdown, kök + alt klasörler |
| `.cursor/rules/*.mdc` | Scoped kural gerekince | `alwaysApply`, `globs`, `description` |
| `.cursor/skills/<ad>/SKILL.md` | Görev prosedürü gerekince | PR review, commit formatı, domain işi |
| User Rules (Settings) | Kişisel tercih | Tüm projelerde senin stilin |
| `.cursorrules` | Hayır | Eski tek dosya; yeni projede yazma |

Cursor `CLAUDE.md` okumaz.

## AGENTS.md

Kökte veya alt klasörde düz markdown:

```text
project/
  AGENTS.md
  frontend/AGENTS.md
  backend/AGENTS.md
```

Alt klasördeki dosya, o ağaçta çalışırken ebeveynle birleşir; daha spesifik olan öne çıkar.

İçerik: build komutları, test, stil, "yapma" listesi. Frontmatter yok.

## `.cursor/rules/*.mdc`

Düz `.md` bu klasörde **yok sayılır**. Uzantı `.mdc` olmalı ve YAML frontmatter şart.

```markdown
---
description: TypeScript kuralları
globs: **/*.{ts,tsx}
alwaysApply: false
---

# TypeScript

- strict mode
- any yasak
```

| Mod | Frontmatter |
| --- | --- |
| Her sohbet | `alwaysApply: true` |
| Dosya açıkken | `globs: **/*.ts` |
| Model karar versin | `description: ...` + `alwaysApply: false` (glob yok) |
| Elle `@kural` | description var, alwaysApply false |

Şablonlar:

- [`templates/cursor/always-apply.mdc`](../templates/cursor/always-apply.mdc)
- [`templates/cursor/glob-rule.mdc`](../templates/cursor/glob-rule.mdc)

## Skills

```text
.cursor/skills/review-pr/SKILL.md
```

Frontmatter'da `name` ve `description` yaz. Description, ajanın skill'i ne zaman seçeceğini belirler.

Kişisel skill: `~/.cursor/skills/<ad>/SKILL.md`  
Proje skill: `.cursor/skills/<ad>/SKILL.md`

Şablon: [`templates/skills/SKILL.md`](../templates/skills/SKILL.md)

## Ne yazılır, ne yazılmaz

- Her oturumda gereken 10 satır → `AGENTS.md` veya always-apply kural
- Sadece React dosyalarında gereken kural → glob `.mdc`
- 40 adımlık release checklist → skill
- API anahtarı, local URL → User Rules veya gitignore'lı dosya

Ortak yazım: [how-to-write.md](../docs/how-to-write.md)

## Kaynak

- https://cursor.com/docs/rules
