<div align="center">

# 🌾 Çiftlik Pro

**Her çiftlik sahibinin kendi izole çiftliğini (tenant) yönettiği, rol bazlı
yetkilendirmeye sahip, çok-kiracılı (multi-tenant) tam yığın Çiftlik Yönetim
Sistemi (ERP) — hayvan, tarla, stok, finans, satış, mağaza ve personel tek panelde.**

[![CI](https://github.com/YusufKosarDev/ciftlik-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/YusufKosarDev/ciftlik-pro/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![codecov](https://codecov.io/gh/YusufKosarDev/ciftlik-pro/branch/main/graph/badge.svg)](https://codecov.io/gh/YusufKosarDev/ciftlik-pro)
[![Tests](https://img.shields.io/badge/tests-304%20unit%20%2B%2030%20e2e-success)](#test--kalite)
[![Multi-tenant](https://img.shields.io/badge/multi--tenant-Postgres%20RLS-4169E1)](#-çok-kiracılık-multi-tenant-saas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🔗 **Canlı Demo: [ciftlik-pro.vercel.app](https://ciftlik-pro.vercel.app)**
&nbsp;·&nbsp; Giriş ekranında **rol seçin** — Yönetici, Çalışan, Veteriner ya da Muhasebeci

</div>

---

## 🌍 In English

The primary README is in English: **[README.md](README.md)**.
It covers the same material — architecture, multi-tenancy, security and setup.
---

## 🎬 60 saniyede Çiftlik Pro

Giriş → panel → hayvan listesi (sunucu-taraflı arama) → hayvan detayı
(süt/ağırlık grafikleri) → 2D harita → takvim → finans → dark mode → çiftlik
mağazası:

![Çiftlik Pro demo turu](docs/demo.gif)

> Kendiniz denemek için: **[ciftlik-pro.vercel.app](https://ciftlik-pro.vercel.app)**
> → giriş ekranından bir rol seçin.

## 📸 Ekran Görüntüleri

**Panel (Dashboard)** — sol sidebar, özet kartları (gerçek "bu ay" trend
göstergeleriyle) ve aylık gelir-gider grafiği:

![Dashboard](docs/screenshots/dashboard.png)

| 🌙 Dark mode | 🛒 Çiftlik mağazası (`/magaza/[slug]`) |
| ------------ | -------------------------------------- |
| ![Dark mode](docs/screenshots/dashboard-dark.png) | ![Mağaza](docs/screenshots/store.png) |

| 💳 Abonelik — plan & kullanım limitleri | 👥 Personel — davet & rol yönetimi |
| --------------------------------------- | ----------------------------------- |
| ![Abonelik](docs/screenshots/billing.png) | ![Personel](docs/screenshots/staff.png) |

| Hayvanlar (sunucu-tarafı aranabilir tablo) | Hayvan detayı (süt/ağırlık grafikleri) |
| ------------------------------------------ | -------------------------------------- |
| ![Hayvanlar](docs/screenshots/animals.png) | ![Hayvan detayı](docs/screenshots/animal-detail.png) |

| 2D Çiftlik Haritası | Takvim (aşı/görev/hasat/doğum) |
| ------------------- | ------------------------------ |
| ![Harita](docs/screenshots/map.png) | ![Takvim](docs/screenshots/calendar.png) |

**Hoş geldin turu (onboarding)** — ilk girişte role özel, çok adımlı tanıtım:

![Hoş geldin turu](docs/screenshots/onboarding.png)

## ✨ Özellikler

- **Çok-kiracılık (multi-tenant SaaS)** — her çiftlik sahibi kayıt olup kendi
  **izole çiftliğini (tenant)** yönetir; veriler Postgres **RLS** + uygulama-katmanı
  `tenantId` filtreleriyle tenant'lar arasında **asla** sızmaz. Ayrıntı:
  [Çok-kiracılık](#-çok-kiracılık-multi-tenant-saas).
- **Kimlik doğrulama & RBAC** — giriş ve rol bazlı erişim (Admin, Çalışan,
  Veteriner, Muhasebeci). **Herkese açık çiftlik kaydı** (`/kayit`) tek
  transaction'da Tenant + sahip-ADMIN oluşturur; personel ise **token'lı davetle**
  tenant içinde eklenir. Parolalar asenkron scrypt ile hash'lenir (eski bcrypt şifreleriyle geriye dönük tam uyumludur).
- **Planlar & faturalandırma** — FREE/PRO planları ve zorlanan limitler (aktif
  hayvan / personel koltuğu); env-gated **Stripe abonelik** akışı (webhook →
  `Tenant.plan`) ve kullanım panosu. **KVKK:** veri ihracı (JSON) + çiftlik silme.
- **Hayvan takibi** — kayıt yönetimi, sağlık kayıtları, aşı takvimi (tarih
  uyarılı), süt verimi (trend grafiği), ağırlık/büyüme takibi (grafik).
- **Üreme & soy** — gebelik/doğum kayıtları ve yavru–anne (pedigri) bağlantısı.
- **Tarla yönetimi** — tarlalar, ekim/hasat kayıtları, ekim başına maliyet/gelir
  ve dönüm başına verim; 2D çiftlik haritası.
- **Stok & yem** — yem/ilaç/ekipman takibi, kritik seviye uyarısı; yem tüketimi
  stoğu otomatik düşürür (transactional).
- **Finans** — gelir-gider kayıtları, net bakiye özeti, aylık grafik.
- **Satış & Müşteri** — satış kayıtları müşteriye bağlanır; her satış otomatik bir
  **gelir işlemi** üretip finansa yansır (transactional). Müşteri detayında satış
  geçmişi ve toplam ciro.
- **Mağaza & Sipariş** — **per-tenant** herkese açık katalog (`/magaza` dizini →
  `/magaza/[slug]` çiftlik kataloğu), slug'a özel `localStorage` sepeti ve
  çok-kalemli sipariş; **Stripe** yapılandırıldıysa ödeme, yoksa "ödeme teslimatta".
  Admin tarafında ürün CRUD + sipariş durum yönetimi.
- **Takvim** — aşı, görev, hasat ve doğumlar tek aylık takvimde.
- **Personel & görevler** — çalışanlara görev atama, gecikme uyarısı.
- **Dashboard** — özet kartları (gerçek "bu ay" trend göstergeleriyle), kritik
  stok / geciken görev / yaklaşan aşı uyarıları.
- **Modern arayüz** — sol sidebar düzeni, dark mode (semantik renk token'ları), `⌘K`
  komut paleti (hızlı gezinme + eylem) ve `cva` tabanlı tasarım sistemi.
- **Çok dillilik (i18n) — uçtan uca** — her ekran ve her API hata mesajı, iki
  katalogdaki **826 çeviri anahtarının tamamıyla**: panel, herkese açık mağaza ve
  sepet, abonelik, davet akışı, 404 ve hata sınırları, yazma uçlarının döndürdüğü
  yanıtlar. Tarih, para ve grafik ay etiketleri de aktif dile uyar. İlk kez gelen
  ziyaretçi **tarayıcısının dilini** görür (`Accept-Language`); başlıktaki — ya da
  Profil sayfasındaki — değiştirici seçimi cookie'ye sabitler. İki istisna
  bilinçlidir: çiftlik verisi onu giren kiracıya aittir ve günlük özet
  e-postasının dilini okuyacağı bir ziyaretçi yoktur.
- **Hoş geldin turu (onboarding)** — ilk panel girişinde role özel, çok adımlı
  tanıtım modal'ı; Profil'den istenildiğinde yeniden başlatılabilir.
- **Aranabilir tablolar** — tüm liste modüllerinde **sunucu-tarafı (DB)** arama,
  kolon sıralama ve sayfalama; durum URL'de tutulur (paylaşılabilir/derin bağlantı).
- **E-posta bildirimleri** — günlük cron (Vercel Cron) ile kritik stok, geciken
  görev ve yaklaşan aşı özetini yöneticilere e-posta gönderir (Resend).

## 🏆 Öne Çıkan Mühendislik Detayları

- **Çok-kiracılı izolasyon (RLS + app)** — Postgres Row-Level Security (`FORCE` +
  `WITH CHECK`) ve tenant-kapsamlı Prisma extension; pgbouncer-uyumlu
  `SET LOCAL app.tenant_id`. Üretimde non-superuser rol. (Bkz.
  [Çok-kiracılık](#-çok-kiracılık-multi-tenant-saas).)
- **Rol bazlı yetkilendirme (RBAC)** tek merkezden (`src/lib/authz.ts`); hem yazma
  (API) hem hassas okuma (sayfa) düzeyinde uygulanır.
- **Uçtan uca tip güvenliği** — Zod şemaları hem istemci hem sunucuda doğrular;
  Prisma ile veritabanı tipleri.
- **Test & CI/CD** — 304 birim/bileşen testi (Vitest + Testing Library) +
  tenant-izolasyon entegrasyon testleri + 30 uçtan uca test (Playwright),
  GitHub Actions'ta gerçek PostgreSQL servisiyle her PR'da çalışır.
- **Transactional bütünlük** — yem tüketimi stoğu atomik düşürür (TOCTOU'ya karşı
  koşullu `updateMany`); satış + bağlı gelir işlemi ve sepet → çok-kalemli sipariş
  tek `$transaction` içinde, fiyat/ad **snapshot**'larıyla oluşturulur.
- **Serverless-doğru veritabanı** — pooled (`DATABASE_URL`) + direct
  (`DIRECT_URL`) ayrımıyla Vercel + Neon/Supabase'e hazır.
- **Sunucu-tarafı listeleme** — arama/sıralama/sayfalama veritabanında yapılır
  (`where` / `orderBy` / `skip` / `take` + `count`); büyük tablolarda bellek/ağ
  yükü sabit kalır. Sık filtrelenen tarih kolonlarında DB index'leri.
- **Performans-odaklı yükleme** — Recharts `next/dynamic` (ssr:false) ile tembel
  yüklenir; görseller lazy. Finans özet/kırılımı `groupBy` ile DB'de hesaplanır.
- **Opsiyonel/env-gated entegrasyonlar** — Stripe ödeme ve Resend e-posta yalnızca
  ilgili anahtarlar tanımlıysa devreye girer; yoksa uygulama sorunsuz çalışır.
- **Yeniden kullanılabilir tasarım sistemi** — `cva` tabanlı Button/Badge
  primitive'leri, URL-güdümlü jenerik `DataTable` ve semantik token tabanlı dark mode.

## 🧱 Mimari

```mermaid
flowchart LR
  B[Tarayıcı] -->|HTTP| P[Proxy / Auth.js<br/>oturum + tenantId]
  P --> RSC[Next.js App Router<br/>Sunucu Bileşenleri]
  RSC --> TX[withTenant / forTenant<br/>SET LOCAL app.tenant_id]
  RSC --> API[API Route'ları]
  API -->|RBAC + Zod| TX
  TX -->|RLS zorlamalı| DB[(PostgreSQL · RLS)]
```

- **App Router (RSC)** — listeler sunucuda **tenant-kapsamlı** Prisma ile okunur.
- **API Route'ları** — tüm yazma işlemleri; `authorizeWrite` (RBAC) + Zod doğrulaması.
- **Auth.js (NextAuth v5)** — JWT oturum (rol + **`tenantId`**); edge-uyumlu proxy ile rota koruması.
- **Tenant-kapsamlı Prisma** — `forTenant` her sorguya `tenantId` enjekte eder;
  `withTenant` interaktif transaction içinde `SET LOCAL app.tenant_id` ayarlar
  (pgbouncer-uyumlu). Postgres **RLS** DB-seviyesinde son garanti.

📖 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — kararlar, reddedilen
alternatifler ve bilinen sınırlamalar (İngilizce) ·
**[docs/API.md](docs/API.md)** — tüm uç noktalar, gereken roller ve doğrulama
şemaları (İngilizce)

## 🔐 Güvenlik & RBAC

Yetkilendirme tek merkezden yönetilir (`src/lib/authz.ts`) ve **iki katmanda**
uygulanır: yazma uçları `authorizeWrite` ile, hassas/forma dayalı sayfalar ise
`requirePageWrite` / `requirePageView` ile korunur. **Okuma** giriş yapmış her
kullanıcıya açıktır; **yazma** ise role göre kısıtlanır:

| Rol           | Yazma yetkisi                                                        |
| ------------- | ------------------------------------------------------------------- |
| **Admin**     | Tüm modüller + personel yönetimi + denetim günlüğü                  |
| **Çalışan**   | Hayvan, süt, ağırlık, tarla/ekim, stok/yem, yapılar, üreme         |
| **Veteriner** | Sağlık & aşı, üreme, ağırlık                                        |
| **Muhasebeci**| Finans, Satış, Müşteri, Ürün/Mağaza, Sipariş yönetimi               |

Sertleştirme önlemleri:

- **Tenant izolasyonu (iki katman)** — Postgres **RLS** (`ENABLE`+`FORCE`,
  `WITH CHECK`) her tenant-tablosunu DB-seviyesinde korur; ayrıca uygulama katmanı
  her sorguya `tenantId` enjekte eder. Üretimde uygulama **non-superuser** rolle
  bağlanır (RLS bypass edilemez). İzolasyon entegrasyon testleriyle doğrulanır.
- **Kayıt & davet** — herkese açık **çiftlik kaydı** sahip-ADMIN üretir; personel
  yalnızca **token'lı davetle** eklenir. Davet token'ları tahmin edilemez sırlardır,
  süre sınırlıdır ve tek kullanımlıktır. Ziyaretçiler giriş ekranından rol seçerek salt-okunur vitrin hesaplarıyla gezer.
- **Demo hesabı salt-okunurdur** — hiçbir yazma işlemi yapamaz (canlı demoda veri korunur).
- **Parolalar scrypt** ile hash'lenir (eski bcrypt şifreleriyle geriye dönük uyumludur);
  sabit zamanlı karşılaştırma (`timingSafeEqual`) ve asenkron hashing ile olay döngüsü kilitlenme korumalıdır. Düz metin asla saklanmaz/dönülmez.
- **HTTP güvenlik başlıkları** — tüm yanıtlara CSP, HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy` ve `Permissions-Policy` (`next.config.ts`).
- **Brute-force koruması** — giriş hem IP hem IP+e-posta bazında sınırlanır
  (böylece tek saldırgan ortak bir IP'den tüm hesapları kilitleyemez); kayıt,
  çiftlik oluşturma, davet kabulü ve herkese açık sipariş uçları IP bazında
  sınırlanır (`src/lib/rate-limit.ts`). Başarısız giriş denemeleri denetim
  günlüğüne (`LOGIN_FAILED`) yazılır. Sayaçlar **Postgres'ta** tutulur ve tek bir
  atomik upsert ile artırılır; böylece limit serverless örnekleri arasında
  bölünmez. Eşzamanlılık, gerçek veritabanına karşı çalışan bir entegrasyon
  testiyle doğrulanır (limit 4 iken 10 eşzamanlı istek → tam olarak 4 başarılı).
  Veritabanına ulaşılamazsa sınırlayıcı **fail-open** davranır ve bellek içi
  sayaca düşer: hız sınırı bir derinlik katmanıdır, tek başına bir kapı değil —
  kısa bir veritabanı kesintisinde herkesi uygulamadan kilitlemek, önlediğinden
  daha fazla zarar verirdi.
- **Güvenli görsel URL'leri** — hayvan görseli yalnızca `http(s)` URL kabul eder
  (Zod); `javascript:` / `data:` şemaları reddedilir (CSP `img-src` ile uyumlu).
- **Çift taraflı doğrulama** — Zod şemaları hem istemcide hem her yazma ucunda sunucuda çalışır.
- **Denetim günlüğü** — çiftlik verisini, faturalandırmayı veya hesap durumunu
  değiştiren her yazma (kim / ne / ne zaman) `AuditLog`'a kaydedilir: tüm
  modüllerdeki CRUD, plan değişiklikleri (Stripe webhook'unun yaptıkları dahil),
  herkese açık mağaza siparişleri ve çiftlik silme — sonuncusu silmeden **sonra**
  ve tenant'sız yazılır, böylece kayıt anlattığı hesaptan sağ çıkar. Hoş geldin
  turu bayrağı bilinçli olarak denetlenmez: iş verisi değil, arayüz tercihidir.
- **Korumalı cron** — bildirim ucu `CRON_SECRET` ile `Authorization` başlığı doğrular.

## 🏢 Çok-kiracılık (Multi-tenant SaaS)

Proje tek-çiftlik bir ERP'den, **her çiftlik sahibinin kendi izole çiftliğini
(tenant) yönettiği** çok-kiracılı bir SaaS'a dönüştürülmüştür. **#1 risk veri
sızıntısıdır:** tek bir tenant'sız sorgu = ihlal. Bu yüzden izolasyon **iki
bağımsız katmanda** zorlanır:

1. **Postgres Row-Level Security (RLS)** — her tenant-tablosunda `ENABLE` + `FORCE`
   ve `tenant_isolation` policy'si (`tenantId = current_setting('app.tenant_id')`,
   yazmada `WITH CHECK`). Sorgu nereyi unutursa unutsun **veritabanı sızdırmaz**.
   Üretimde uygulama **non-superuser** rolle bağlanır (`prisma/rls-app-role.sql`,
   bkz. [`docs/PRODUCTION-RLS.md`](docs/PRODUCTION-RLS.md)).
2. **Uygulama katmanı** — bir Prisma Client Extension (`forTenant`) `where`'lere
   otomatik `tenantId` enjekte eder; `withTenant` interaktif `$transaction` içinde
   `SET LOCAL app.tenant_id` ayarlar — **pgbouncer/serverless uyumlu** desen.

Öne çıkanlar:

- **Per-tenant unique kısıtlar** — örn. kulak numarası `@@unique([tenantId, tagNumber])`.
- **Oturum** — JWT/session'da `tenantId`; tüm okuma/yazma bu bağlamda çalışır.
- **Kayıt & davet** — public çiftlik kaydı (`/kayit`) + token'lı personel daveti (`/davet/[token]`).
- **Planlar** — FREE/PRO, zorlanan limitler, env-gated Stripe abonelik + kullanım panosu.
- **Per-tenant mağaza** — `/magaza/[slug]`; sipariş slug→tenant çözümüyle oluşturulur.
- **Cron çok-kiracılı** — günlük uyarılar her tenant'ın kendi verisiyle, kendi admin'lerine.
- **KVKK self-servis** — tenant verisi JSON ihracı + çiftlik silme (ADMIN).
- **İzolasyon testleri** — gerçek DB + non-superuser rolle: tenant A, tenant B'nin verisini göremez.

> Tam mimari ve fazlı durum: **[`docs/SAAS-PLAN.md`](docs/SAAS-PLAN.md)**.

## 🛠️ Teknolojiler

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- [PostgreSQL](https://www.postgresql.org/) + [Prisma 6](https://www.prisma.io/) (ORM)
- [Auth.js (NextAuth v5)](https://authjs.dev/) — kimlik doğrulama
- [Tailwind CSS](https://tailwindcss.com/) — arayüz
- [Zod](https://zod.dev/) — veri doğrulama
- [Stripe](https://stripe.com/) — ödeme (opsiyonel, env-gated)
- [next-intl](https://next-intl.dev/) — çok dillilik · [next-themes](https://github.com/pacocoursey/next-themes) — dark mode
- [Recharts](https://recharts.org/) — grafikler
- [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) — test
- [Docker](https://www.docker.com/) — yerel veritabanı

## Kurulum

### Gereksinimler

- Node.js 20.12+ (ya da CI'ın kullandığı 22 LTS — `npm run db:seed`
  `--env-file-if-exists` bayrağına ihtiyaç duyar)
- Docker (PostgreSQL için)

### Adımlar

1. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

   > **npm 11.17+ kullanıyorsanız:** Bu sürümler paketlerin kurulum
   > betiklerini varsayılan olarak engeller; `postinstall` adımındaki
   > `prisma generate` sessizce atlanabilir. Kurulum çıktısında
   > `allow-scripts` uyarısı görürseniz bir kez şunu çalıştırın:
   >
   > ```bash
   > npx prisma generate
   > ```

2. Ortam değişkenlerini ayarlayın — `.env.example` dosyasını `.env` olarak
   kopyalayıp değerleri doldurun:

   ```bash
   cp .env.example .env
   ```

   Şablon **boş gelir**; devam etmeden önce şunları doldurun:

   | Değişken | Değer |
   | --- | --- |
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | İstediğiniz değerler; Docker veritabanını bunlarla oluşturur. Örn. `ciftlik` / `ciftlik` / `ciftlik_pro` |
   | `DATABASE_URL` **ve** `DIRECT_URL` | Aynı üç değerin URL hâli — **port 5433**: `postgresql://ciftlik:ciftlik@localhost:5433/ciftlik_pro?schema=public` |
   | `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

   > **Neden 5433?** `docker-compose.yml`, konteynerin 5432 portunu host'ta
   > **5433**'e yayınlar; böylece makinenizde zaten çalışan bir PostgreSQL ile
   > çakışmaz. `.env.example`'daki diğer değişkenler opsiyoneldir.

3. PostgreSQL veritabanını Docker ile başlatın:

   ```bash
   docker compose up -d
   ```

4. Veritabanı şemasını uygulayın:

   ```bash
   npx prisma migrate dev
   ```

5. (İsteğe bağlı) Örnek verilerle doldurun:

   ```bash
   npm run db:seed
   ```

6. Geliştirme sunucusunu başlatın:

   ```bash
   npm run dev
   ```

   Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışır.

### Örnek giriş bilgileri

Seed çalıştırıldıysa:

| E-posta             | Parola     | Rol       |
| ------------------- | ---------- | --------- |
| admin@ciftlik.com   | sifre1234  | Admin     |
| ahmet@ciftlik.com   | sifre1234  | Çalışan   |
| vet@ciftlik.com     | sifre1234  | Veteriner |

### Demo hesapları (`npm run db:seed-demo` sonrası ve canlı demoda)

Salt-okunur vitrin hesapları — her rol için bir tane. Amaç sayı değil,
görünürlük: RBAC matrisi böylece anlatılan değil, ziyaretçinin kendi gözüyle
gördüğü bir şey oluyor. Giriş ekranı bunları düğme olarak sunuyor ve her
düğmede o rolün neye erişemediği yazıyor — daralan menü bir arayüz hatası
gibi değil, kasıtlı bir yetki sınırı gibi okunsun diye.

| E-posta                     | Parola   | Rol        | Erişemediği                                                        |
| --------------------------- | -------- | ---------- | ------------------------------------------------------------------ |
| demo@ciftlik.com            | demo1234 | Yönetici   | yok — tüm modüller                                                 |
| demo-worker@ciftlik.com     | demo1234 | Çalışan    | finans, satış, müşteriler, ürünler, siparişler, personel, denetim  |
| demo-vet@ciftlik.com        | demo1234 | Veteriner  | hayvanlar, görevler, harita ve takvim dışında her şey — 16 bölümden 5'i |
| demo-muhasebe@ciftlik.com   | demo1234 | Muhasebeci | hayvanlar, tarlalar, stok, yem, yapılar, personel, denetim         |

Dördü de **rolden bağımsız olarak salt-okunurdur**: koruma e-posta adresine
bağlıdır, yani Çalışan hesabı, Çalışan rolünün normalde yazabildiği yerlerde
bile yazamaz. Gizlenen bölümler sunucu tarafında da reddedilir — doğrudan URL
ile gidilirse proxy'den **gerçek bir HTTP yönlendirmesi** döner, istemci
tarafında bir sıçrama değil.

## Komutlar

| Komut              | Açıklama                          |
| ------------------ | --------------------------------- |
| `npm run dev`      | Geliştirme sunucusu               |
| `npm run build`    | Üretim derlemesi                  |
| `npm run start`    | Üretim sunucusu                   |
| `npm run lint`     | Kod denetimi (ESLint)             |
| `npm test`         | Birim testleri (Vitest)           |
| `npm run test:e2e` | Uçtan uca testler (Playwright)    |
| `npm run db:seed`  | Veritabanını örnek veriyle doldur |
| `npm run db:seed-demo` | Vitrin (demo) verisi + salt-okunur demo hesabı |
| `npm run db:seed-demo -- --reset` | Demo tenant'ını koşulsuz sıfırlayıp yeniden kurar |

> **Demo verisi kendi kendini günceller.** İçerik `src/lib/demo-data.ts`
> içinde sürümlenir (`DEMO_DATA_VERSION`); veritabanındaki sürüm eskiyse üretim
> derlemesi demo tenant'ını otomatik yeniden kurar. Ayrıca gecelik bir cron
> (`/api/cron/demo-reset`) demoyu sıfırlar; böylece canlı demo her ziyarette
> aynı dolu ve derli toplu halde görünür.

> Seed komutları `.env` dosyasını Node'un `--env-file-if-exists` bayrağıyla
> kendileri yükler; ayrıca ortam değişkeni vermeniz gerekmez.

> **Docker imajı:** `output: "standalone"` yalnızca `BUILD_STANDALONE=1` ile
> derlendiğinde (Dockerfile bunu ayarlar) etkinleşir ve imaj
> `node .next/standalone/server.js` ile çalışır. Yerelde ve Vercel'de normal
> mod kullanılır; bu yüzden `npm run build && npm run start` sorunsuz çalışır.

## Test & Kalite

- **Birim testleri (Vitest):** doğrulama şemaları, RBAC yetkilendirme, hız sınırı,
  liste sorgu parametreleri, plan limitleri, finans/harita/tarih/takvim yardımcıları
  + UI bileşenleri (Testing Library: Badge/Button/EmptyState/DataTable/OnboardingModal)
  — `npm test` (304 test). Kapsam raporu için
  `npm run test:coverage` (iş mantığı `src/lib` için ~%90 satır kapsamı; paylaşılan veritabanı yolları entegrasyon testleriyle kapsanır).
- **Tenant-izolasyon entegrasyon testleri:** gerçek PostgreSQL + non-superuser
  `ciftlik_app` rolüyle `forTenant`/RLS izolasyonu (`*.int.test.ts`) — tenant A
  tenant B'nin verisine erişemez, bağlamsız sorgu 0 satır döner, `Invitation` da
  RLS altındadır ve paylaşılan hız sınırı sayacı eşzamanlılık altında doğrulanır.
  `RUN_DB_TESTS=1` ile gatelenir (böylece `npm test` veritabanı istemez);
  **CI bu değişkeni açar**, testler her push/PR'da gerçekten koşar.
- **Uçtan uca testler (Playwright):** kimlik doğrulama, hayvan CRUD, RBAC
  reddi (gerçek 307), satış → otomatik gelir işlemi, mağaza sepeti → sipariş,
  davet → kabul → rol, demo rol kapsamı ve salt-okunurluk — `npm run test:e2e` (30 test).
- **CI (GitHub Actions):** her push/PR'da üç paralel job —
  `build` (tsc + ESLint + Vitest + üretim derlemesi),
  `integration` (PostgreSQL + `ciftlik_app` rolü + izolasyon testleri) ve
  `e2e` (gerçek PostgreSQL servisi + seed + Playwright).
- **Lighthouse** (üretim derlemesi, mobil emülasyon): giriş **88** / mağaza **92**
  performans, **95-96** erişilebilirlik, **100** best practices, **100** SEO,
  ikisinde de **CLS 0**. Ayrıntı: [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md).
- **Pre-commit (husky + lint-staged):** commit öncesi staged `.ts/.tsx`
  dosyalarında otomatik `eslint --fix` çalışır.

## Proje Yapısı

```
prisma/            Şema ve migration dosyaları
src/
  app/             Sayfalar ve API rotaları (App Router)
    api/           REST API uç noktaları
    panel/         Korumalı yönetim paneli
  components/      Yeniden kullanılabilir bileşenler
  lib/             Yardımcılar (prisma, auth, doğrulama, etiketler)
```

## Vercel'e Deploy

1. **Veritabanı:** [Neon](https://neon.tech) veya [Supabase](https://supabase.com)
   üzerinde bir PostgreSQL oluşturun. İki bağlantı dizesi alın:
   - **Pooled** (pgbouncer) → `DATABASE_URL` (uygulama çalışma zamanı)
   - **Direct** (pooler olmayan) → `DIRECT_URL` (migration'lar için)

   > Serverless ortamda (Vercel) bağlantı tükenmesini önlemek için uygulama
   > havuzlanmış bağlantı, migration'lar ise doğrudan bağlantı kullanır.

2. **Vercel:** Bu repoyu Vercel'e import edin (Next.js otomatik algılanır).
   `prisma generate` deploy sırasında `postinstall` ile otomatik çalışır.
3. **Ortam değişkenleri** (Vercel → Project Settings → Environment Variables):

   | Değişken         | Açıklama                                       |
   | ---------------- | ---------------------------------------------- |
   | `DATABASE_URL`   | Üretim PostgreSQL **pooled** bağlantı dizesi   |
   | `DIRECT_URL`     | Üretim PostgreSQL **direct** bağlantı dizesi   |
   | `AUTH_SECRET`    | `openssl rand -base64 32` ile üretin           |
   | `ADMIN_EMAIL`    | İlk yönetici e-postası                         |
   | `ADMIN_PASSWORD` | İlk yönetici parolası (en az 8 karakter)       |
   | `ADMIN_NAME`     | İlk yönetici adı (opsiyonel)                   |

   > **Opsiyonel (env-gated):** `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
   > (mağaza ödemesi), `STRIPE_PRO_PRICE_ID` (PRO abonelik faturalandırması),
   > `RESEND_API_KEY` + `ALERT_EMAIL_FROM` (e-posta uyarıları), `CRON_SECRET`
   > (cron koruması), `NEXT_PUBLIC_SITE_URL` (Stripe redirect adresi). Tanımlı
   > değilse ilgili özellik zarif biçimde devre dışı kalır. Tümü `.env.example`'da listelidir.

4. **Şemayı üretim DB'sine uygulayın** (ilk deploy'dan önce, yerelden):

   ```bash
   # Migration'lar direct bağlantı üzerinden uygulanır
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run db:deploy
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" \
     ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed-admin
   ```

   Not: Bu repoda `vercel.json` bunu zaten yapıyor — **üretim** derlemesi sırayla
   `prisma migrate deploy` → vitrin (demo) seed'i → `next build` çalıştırır.
   Seed, koddaki veri sürümüyle veritabanındakini karşılaştırır ve yalnızca
   farklıysa yeniden doldurur. Önizleme (preview) derlemeleri sadece
   `next build` koşar.

5. `main` dalına push → Vercel otomatik derleyip yayınlar.
