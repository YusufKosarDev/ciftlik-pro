# Ekran Görüntüleri

README'de kullanılan görseller (admin hesabı + örnek/demo veriyle, çalışan
uygulamadan Playwright ile alındı):

- `onboarding.png` — Hoş geldin turu (ilk girişte role özel, çok adımlı modal)
- `dashboard.png` — Panel ana sayfası (özet kartları + aylık grafik + uyarılar)
- `dashboard-dark.png` — Panel, koyu tema
- `map.png` — 2D çiftlik haritası (tarlalar + yapılar)
- `animals.png` — Hayvanlar listesi (aranabilir/sıralanabilir tablo)
- `finance.png` — Finans (özet kartları + kategori dağılımı + işlem tablosu)
- `animal-detail.png` — Hayvan detayı (süt/ağırlık grafikleri, üreme, soy)
- `feed.png` — Yem yönetimi (stok + tüketim)
- `calendar.png` — Takvim (aşı/görev/hasat/doğum)
- `billing.png` — Abonelik (plan + kullanım limitleri panosu)
- `staff.png` — Personel (token'lı davet + rol yönetimi; gerçek e-postalar maskeli)
- `store.png` — Herkese açık çiftlik mağazası (`/magaza/[slug]` kataloğu)

## İki dilde üretme

Görseller iki dilde tutulur: bu klasördeki Türkçe set `README.tr.md`'de,
`en/` altındaki İngilizce set `README.md`'de kullanılır.

```bash
# Uygulama ayakta olmalı (yerel üretim derlemesi ya da canlı demo)
npm run build && npm run start

SHOT_BASE=http://localhost:3000 node scripts/shots.mjs                  # Türkçe → bu klasör
SHOT_BASE=http://localhost:3000 SHOT_LOCALE=en node scripts/shots.mjs   # İngilizce → en/

# Tanıtım GIF'leri (README'lerin en üstü)
SHOT_BASE=http://localhost:3000 node scripts/demo-gif.mjs               # docs/demo.gif
SHOT_BASE=http://localhost:3000 SHOT_LOCALE=en node scripts/demo-gif.mjs # docs/demo.en.gif
```

Script'ler dili hem `NEXT_LOCALE` cookie'siyle hem tarayıcı `locale`'iyle
ayarlar; metne dayalı seçicileri (demo düğmesi, tema anahtarı) `messages/*.json`
kataloğundan okur — böylece çeviri değişince sessizce kırılmazlar.
