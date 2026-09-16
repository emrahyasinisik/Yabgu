# Modeller talimatı nasıl ister

Kaynak: Anthropic Claude Code, OpenAI Codex, Google Gemini CLI, GitHub Copilot, Cursor, Grok Build, [agents.md](https://agents.md/). Hepsi aynı çekirdeği söylüyor; dosya adı değişiyor.

Yabgu’nun işi bu çekirdeği `AGENTS.md`’ye yazmak, kopyalamamak, şişirmemek.

## Ortak çekirdek (hepsi)

| Kural | Neden | Kim söylüyor |
| --- | --- | --- |
| Kısa tut | Her satır her turda token yer. Uzun dosya **daha az** uyulur. | Claude: ~200 satır. Codex: varsayılan **32 KiB** birleşik tavan. Copilot: her mesajla gider. Gemini: “her satır kira öder.” |
| Somut ve doğrulanabilir yaz | “Düzgün formatla” işe yaramaz. | Claude: `2 space`, `npm test` commit öncesi. |
| Yasakları açık yaz | Olumsuz kural, belirsiz olumludan daha iyi tutulur. | Gemini resmi: “Do not use class components.” |
| Koddan çıkanı yazma | TypeScript kullandığını `.ts` zaten söyler. | Gemini / localskills özeti |
| Silme testi | Bu satır kalkınca ajan hata yapar mı? Hayırsa kes. | Anthropic: şişik CLAUDE.md talimatı **yoksayar** |
| Çelişki bırakma | Model birini rastgele seçer. | Claude, Copilot, agents.md |
| Prosedürü her tura koyma | 30 satırlık runbook skill’dir, bellek dosyası değil. | Anthropic steering |
| “Asla”yı metinle kilitleme | Metin tavsiyedir. Gerçek kilit: hook, permission, CI. | Claude: CLAUDE.md ≠ enforcement |
| Komutu tam yaz | Ajan listelenen testi **çalıştırmaya** çalışır. | agents.md, Codex örnekleri |
| Neden’i bir cümle söyle | Kısıtın gerekçesi uyumu artırır. | Anthropic prompting |

## Ne yazılır (agents.md + vendor örnekleri)

Kök dosyada bunlar durur:

- 2–4 cümle proje özeti (kodun söylemediği kararlar)
- Install / start / test / lint — kopyalanabilir komut
- Stil: formatter, naming, “bu repoda şöyle”
- Test: ne zaman, tek testi nasıl koşarsın
- Güvenlik: secret, `.env`, dokunulmayacak yollar
- PR: küçük diff, CI yeşil

Kökte durmaz:

- README kopyası
- Framework dersi (“React nedir”)
- Lint’in zaten yakaladığı format
- Deploy runbook, release checklist → skill
- “İyi kod yaz” gibi boş cümle

## Araç farkları (yazarken)

**Claude (Opus / Sonnet, Claude Code)**  
`CLAUDE.md` bağlamdır, kilit değil. ~200 satır. `@AGENTS.md` ile paylaş. Plan mode büyük işte. Hook = zorunlu yasak. Alt klasör `CLAUDE.md` ancak o ağaca girince yüklenir (token tasarrufu).

**GPT / Codex**  
`AGENTS.md` birleştirilir, alta yakın olan sonra gelir. `AGENTS.override.md` aynı dizinde `AGENTS.md`’yi ezer. 32 KiB’i aşınca **kırpılır** — kritik kuralı dosyanın başına ve iç içe klasörlere böl. Code review kuralları ayrı `## Code Review Rules`; lint’i CI’ya bırak.

**ChatGPT web**  
Repo md yüklenmez. Aynı kısa metni Custom instructions / Project’e yapıştır. Codex kullanıyorsan dosya yeter.

**Gemini**  
`GEMINI.md` her prompt’a eklenir. Negatif kural + hiyerarşi. `@import` bakımı kolaylaştırır, **token düşürmez** (yine inline). Token için sil veya alt klasöre taşı. `@AGENTS.md` Claude gibi genişlemez; `context.fileName` ayarla.

**Cursor (Auto / Grok / Claude / GPT — host Cursor)**  
Kök `AGENTS.md` her oturum. Scoped kural `.mdc` + glob: her tura girmez. Düz `.md` `.cursor/rules/` içinde yok sayılır. Skill = görev prosedürü.

**GitHub Copilot**  
Kısa, kendi başına duran cümleler. `copilot-instructions.md` özet; uzun ortak metin `AGENTS.md`. Path-specific `applyTo`. Çelişen katmanları (kişisel + repo + org + AGENTS) biriktirme.

**Grok Build**  
`AGENTS.md` + skill + hook. Plan mode büyük değişiklik. `grok inspect` hangi talimatın yüklendiğini gösterir.

**Qwen / DeepSeek / açık ağırlıklar (Cline, Continue, OpenCode)**  
Host `AGENTS.md` veya native rules okur. Prompt tarafı: hedef, kısıt, kabul kriteri, doğrulama. Prosedürü aşırı yazma; ajanın dosya gezmesini bozar.

## Yazım kalıbı

Kötü:

```markdown
Kod kaliteli olsun. Test etmeyi unutma. Güvenliğe dikkat.
```

İyi:

```markdown
- Install: `pnpm install`
- Test: `pnpm test` (tek dosya: `pnpm vitest run path/to/file.test.ts`)
- Do not edit `src/db/migrations/` without a human in the PR
- Do not use `any`. Prefer `unknown` and narrow.
```

## Pratik döngü (modellerin önerdiği iş)

Keşfet → planla → uygula → test/lint çalıştır. Bunu AGENTS.md’ye manifesto olarak yazma; **komutları** yaz, ajan bitirmeden onları koşar.

## Bu repoda nerede

- Şablon: [`templates/AGENTS.md`](../templates/AGENTS.md)
- Tek kaynak: [`shared-source-of-truth.md`](shared-source-of-truth.md)
- Dosya adları: [`matrix.md`](matrix.md)
