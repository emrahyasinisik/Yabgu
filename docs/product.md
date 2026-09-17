# Ürün kuralı

Yabgu ajanın **nasıl konuştuğuna karışmaz.** Hitap, dil, nezaket — host’un işi.

Yabgu: daha doğru proje bağlamı, daha az token.

## Sıra

1. **Katalog + şablonlar** — hangi ajan hangi native dosyayı okur, nasıl yazılır (ürün çekirdeği; önce bunu bitir / güncelle).
2. **MCP (yerel stdio)** — doküman/şablon sunar; `scan` → `plan` → kullanıcı onayı → `apply`; `measure` ile before/after. Katalogdan türetilir; native dosyaların yerini almaz.
3. Kurulum [docs/hosts.md](hosts.md) resmi şemalarına göre — host başına snippet (`yabgu_host_setup`). Tahmin yok.

MCP, native dosyaların yerini almaz. Dosyaları **önerir / onayla yazar**; her turda yükleme yine host’undur.

Ölçüm protokolü: [docs/measure.md](measure.md). Token tasarrufu iddiası ancak ayrı before/after ölçümle.

## Gizlilik (MCP)

Ekleyen kişinin projesi **yalnızca kendi makinesinde** kalır. Yabgu’yu yazan / dağıtan kişi o repoyu göremez, çekemez, log’layamaz.

Bu yüzden MCP:

- **stdio / yerel süreç** — Cursor, Claude, Codex, Gemini, Grok’ta varsayılan. Kod yabgu sunucusuna gitmez.
- **Telefon yok:** repo içeriği, yol, dosya listesi, telemetry, “ilk sorgu raporu” yabgu’ya gönderilmez.
- **SaaS analiz yok:** “projeyi bize yükle, AGENTS.md üretelim” modeli yok. Tarama kullanıcının disk’inde.
- **Log:** varsa kullanıcı makinesinde; uzak log yok.
- **Yazma:** yalnızca `yabgu_apply` (host form elicitation UI onayı varsa o; yoksa `confirmed=true`) + isteğe bağlı `overwrite`. Hedef yalnızca native talimat yolları (`AGENTS.md`, ince adaptör, skill) — rastgele kaynak dosyası değil.
- **`YABGU_READ_ONLY=1`:** `yabgu_apply` kaydedilmez. Copilot cloud / salt-okuma kurulumları için.

Host’un (Cursor, GitHub, Claude) zaten açık olan workspace’i ayrı konu — o, yabgu yazarının erişimi değil.

Copilot **cloud** agent MCP’si GitHub altyapısında çalışır. Orada da yabgu bir yabgu-backend’e veri göndermez; `tools` allowlist + salt okuma tool’larında `readOnlyHint` + `YABGU_READ_ONLY=1`. `yabgu_apply` allowlist’e bilinçli eklenmemeli.

Uzak HTTP MCP ancak kullanıcı kendi sunucusunu gösterirse. Yabgu’nun resmi kurulumu uzak endpoint vermez.
