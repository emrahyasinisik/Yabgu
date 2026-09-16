# Ürün kuralı

Yabgu ajanın **nasıl konuştuğuna karışmaz.** Hitap, dil, nezaket — host’un işi.

Yabgu: daha doğru proje bağlamı, daha az token.

## Sıra

1. **Şimdi:** katalog + şablonlar bitsin (hangi ajan hangi native dosyayı okur, nasıl yazılır).
2. **Sonra:** MCP. Kurulum [docs/hosts.md](hosts.md) içindeki **resmi** Cursor / Claude / Codex / Copilot / Gemini / Grok (ve diğer) şemalarına göre — tahmin yok.
3. MCP ilk sorguda projeyi tarar, yalnızca gerekçeli `AGENTS.md` / adaptör / `.mdc` / skill yazar, asıl işe döner. Konuşma stili ve model seçimi yok.

MCP, native dosyaların yerini almaz. Dosyaları **üretir**; her turda yükleme yine host’undur.

## Gizlilik (MCP)

Ekleyen kişinin projesi **yalnızca kendi makinesinde** kalır. Yabgu’yu yazan / dağıtan kişi o repoyu göremez, çekemez, log’layamaz.

Bu yüzden MCP:

- **stdio / yerel süreç** — Cursor, Claude, Codex, Gemini, Grok’ta varsayılan. Kod yabgu sunucusuna gitmez.
- **Telefon yok:** repo içeriği, yol, dosya listesi, telemetry, “ilk sorgu raporu” yabgu’ya gönderilmez.
- **SaaS analiz yok:** “projeyi bize yükle, AGENTS.md üretelim” modeli yok. Tarama kullanıcının disk’inde.
- **Log:** varsa kullanıcı makinesinde; uzak log yok.

Host’un (Cursor, GitHub, Claude) zaten açık olan workspace’i ayrı konu — o, yabgu yazarının erişimi değil.

Copilot **cloud** agent MCP’si GitHub altyapısında çalışır. Orada da yabgu bir yabgu-backend’e veri göndermez; `tools` allowlist + mümkünse salt okuma. Kullanıcı cloud agent kullanıyorsa repo zaten GitHub’dadır — yine yabgu yazarının kopyası oluşmaz.

Uzak HTTP MCP ancak kullanıcı kendi sunucusunu gösterirse. Yabgu’nun resmi kurulumu uzak endpoint vermez.
