<div align="center">

# 🌾 Çiftlik Pro

**Bir çiftliğin tüm operasyonlarını — hayvan, tarla, stok, finans ve görevler —
rol bazlı yetkilendirmeyle tek panelden yöneten tam yığın Çiftlik Yönetim Sistemi (ERP).**

[![CI](https://github.com/YusufKosarDev/ciftlik-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/YusufKosarDev/ciftlik-pro/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Coverage](https://img.shields.io/badge/coverage-~95%25%20(lib)-success?logo=vitest&logoColor=white)](#test--kalite)
[![Tests](https://img.shields.io/badge/tests-200%2B%20unit%20%2B%207%20e2e-success)](#test--kalite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🔗 **Canlı Demo: [ciftlik-pro.vercel.app](https://ciftlik-pro.vercel.app)**
&nbsp;·&nbsp; Giriş için **"Demo olarak gez"** butonu (veya `demo@ciftlik.com` / `demo1234`)

</div>

---

## 🌍 English Summary

**Çiftlik Pro** is a full-stack **Farm Management System (ERP)** that runs a farm's
entire operation — animals, fields, inventory, finance, tasks and staff — from a
single role-based dashboard. _(The detailed documentation below is in Turkish.)_

**Highlights**

- **Auth & RBAC** — Auth.js (NextAuth v5) with four roles (Admin, Worker, Vet,
  Accountant), enforced centrally (`src/lib/authz.ts`) on both write APIs and
  sensitive pages. No public sign-up; visitors explore via a read-only demo.
- **Domain modules** — animal tracking (health, vaccinations, milk yield, weight,
  breeding & lineage), fields & crops with per-crop economics, inventory/feed with
  transactional stock deduction, finance, sales (auto-posted to finance as income),
  calendar, tasks, a 2D farm map, and an onboarding tour.
- **Security hardening** — HTTP security headers (CSP/HSTS/…), brute-force rate
  limiting on login/register, bcrypt (cost 12), `http(s)`-only image URLs, audited
  failed logins, and a full write **audit log**.
- **Performance** — server-side pagination/search/sort (DB `where`/`orderBy`/
  `skip`/`take` + `count`) with date-range indexes, finance aggregates via
  `groupBy`, and lazy-loaded charts (`next/dynamic`).
- **Modern UI** — sidebar layout, dark mode (semantic color tokens), a ⌘K command
  palette, dashboard trend deltas, and an accessible component system.
- **Quality** — end-to-end type safety (Zod + Prisma), **200+ unit/component tests**
  (Vitest + Testing Library) and **7 e2e tests** (Playwright), run on every PR in CI
  against a real PostgreSQL service.

**Stack:** Next.js 16 (App Router, RSC) · TypeScript · PostgreSQL + Prisma 6 ·
Auth.js · Tailwind CSS · Zod · Recharts · Vitest + Playwright · Docker · Vercel.

🔗 **Live demo:** [ciftlik-pro.vercel.app](https://ciftlik-pro.vercel.app) — use the
**"Demo olarak gez"** (Browse as demo) button, or `demo@ciftlik.com` / `demo1234`.

---

## 📸 Ekran Görüntüleri

**Canlı demo** — panel, hayvanlar, hayvan detayı, harita, yem ve takvim arasında kısa tur:

![Canlı demo](docs/screenshots/demo.gif)

**Hoş geldin turu** — ilk girişte role özel, çok adımlı tanıtım:

![Hoş geldin turu](docs/screenshots/onboarding.png)

| Panel (Dashboard) | 2D Çiftlik Haritası |
| ----------------- | ------------------- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Harita](docs/screenshots/map.png) |

| Hayvanlar (aranabilir tablo) | Finans |
| ---------------------------- | ------ |
| ![Hayvanlar](docs/screenshots/animals.png) | ![Finans](docs/screenshots/finance.png) |

| Takvim (aşı/görev/hasat/doğum) | Yem Yönetimi |
| ------------------------------ | ------------ |
| ![Takvim](docs/screenshots/calendar.png) | ![Yem](docs/screenshots/feed.png) |

**Hayvan detayı** — sağlık, aşı, süt verimi & ağırlık grafikleri, üreme ve soy:

![Hayvan detayı](docs/screenshots/animal-detail.png)

## ✨ Özellikler

- **Kimlik doğrulama & RBAC** — giriş ve rol bazlı erişim (Admin, Çalışan,
  Veteriner, Muhasebeci); yeni personeli yalnızca Admin oluşturur (herkese açık
  kayıt yoktur). Parolalar bcrypt ile hash'lenir.
- **Hayvan takibi** — kayıt yönetimi, sağlık kayıtları, aşı takvimi (tarih
  uyarılı), süt verimi (trend grafiği), ağırlık/büyüme takibi (grafik).
- **Üreme & soy** — gebelik/doğum kayıtları ve yavru–anne (pedigri) bağlantısı.
- **Tarla yönetimi** — tarlalar, ekim/hasat kayıtları, ekim başına maliyet/gelir
  ve dönüm başına verim; 2D çiftlik haritası.
- **Stok & yem** — yem/ilaç/ekipman takibi, kritik seviye uyarısı; yem tüketimi
  stoğu otomatik düşürür (transactional).
- **Finans** — gelir-gider kayıtları, net bakiye özeti, aylık grafik.
- **Satış** — ürün/hayvan satış kayıtları (müşteri, miktar, tutar); her satış
  otomatik olarak **gelir işlemi** üretip finansa yansır (transactional).
- **Takvim** — aşı, görev, hasat ve doğumlar tek aylık takvimde.
- **Personel & görevler** — çalışanlara görev atama, gecikme uyarısı.
- **Dashboard** — özet kartları (gerçek "bu ay" trend göstergeleriyle), kritik
  stok / geciken görev / yaklaşan aşı uyarıları.
- **Modern arayüz** — sol sidebar düzeni, dark mode (tema değiştirici), `⌘K`
  komut paleti (hızlı gezinme + eylem) ve `cva` tabanlı tasarım sistemi.
- **Hoş geldin turu (onboarding)** — ilk panel girişinde role özel, çok adımlı
  tanıtım modal'ı; Profil'den istenildiğinde yeniden başlatılabilir.
- **Aranabilir tablolar** — tüm liste modüllerinde **sunucu-tarafı (DB)** arama,
  kolon sıralama ve sayfalama; durum URL'de tutulur (paylaşılabilir/derin bağlantı).
- **E-posta bildirimleri** — günlük cron (Vercel Cron) ile kritik stok, geciken
  görev ve yaklaşan aşı özetini yöneticilere e-posta gönderir (Resend).

## 🏆 Öne Çıkan Mühendislik Detayları

- **Rol bazlı yetkilendirme (RBAC)** tek merkezden (`src/lib/authz.ts`); hem yazma
  (API) hem hassas okuma (sayfa) düzeyinde uygulanır.
- **Uçtan uca tip güvenliği** — Zod şemaları hem istemci hem sunucuda doğrular;
  Prisma ile veritabanı tipleri.
- **Test & CI/CD** — 200+ birim/bileşen testi (Vitest + Testing Library) + 7 uçtan uca test (Playwright),
  GitHub Actions'ta gerçek PostgreSQL servisiyle her PR'da çalışır.
- **Serverless-doğru veritabanı** — pooled (`DATABASE_URL`) + direct
  (`DIRECT_URL`) ayrımıyla Vercel + Neon/Supabase'e hazır.
- **Sunucu-tarafı listeleme** — arama/sıralama/sayfalama veritabanında yapılır
  (`where` / `orderBy` / `skip` / `take` + `count`); büyük tablolarda bellek/ağ
  yükü sabit kalır. Sık filtrelenen tarih kolonlarında DB index'leri.
- **Performans-odaklı yükleme** — ağır grafik kütüphanesi (Recharts) `next/dynamic`
  ile tembel (ssr:false) yüklenir; görseller lazy. Finans özet/kırılımı `groupBy`
  ile DB'de hesaplanır (tüm satırları belleğe çekmeden).
- **Yeniden kullanılabilir tasarım sistemi** — `cva` tabanlı Button/Badge
  primitive'leri ve URL-güdümlü jenerik `DataTable` bileşeni.

## 🧱 Mimari

```mermaid
flowchart LR
  B[Tarayıcı] -->|HTTP| P[Proxy / Auth.js<br/>oturum koruması]
  P --> RSC[Next.js App Router<br/>Sunucu Bileşenleri]
  RSC -->|okuma| DB[(PostgreSQL)]
  RSC --> API[API Route'ları]
  API -->|RBAC + Zod| DB
  RSC -.->|Prisma Client| DB
```

- **App Router (RSC)** — listeler doğrudan sunucuda Prisma ile okunur.
- **API Route'ları** — tüm yazma işlemleri; `authorizeWrite` (RBAC) + Zod doğrulaması.
- **Auth.js (NextAuth v5)** — JWT oturum; edge-uyumlu proxy ile rota koruması.
- **Prisma** — tek `PrismaClient` örneği (singleton).

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
| **Muhasebeci**| Finans (gelir-gider), Satış                                         |

Sertleştirme önlemleri:

- **Herkese açık kayıt yoktur** — yeni personeli yalnızca Admin oluşturur
  (`/api/auth/register`); ziyaretçiler salt-okunur **"Demo olarak gez"** ile gezer.
- **Demo hesabı salt-okunurdur** — hiçbir yazma işlemi yapamaz (canlı demoda veri korunur).
- **Parolalar bcrypt** (maliyet 12) ile hash'lenir; düz metin asla saklanmaz/dönülmez.
- **HTTP güvenlik başlıkları** — tüm yanıtlara CSP, HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy` ve `Permissions-Policy` (`next.config.ts`).
- **Brute-force koruması** — giriş ve kayıt uçlarında IP / e-posta bazlı hız sınırı
  (`src/lib/rate-limit.ts`); başarısız giriş denemeleri denetim günlüğüne
  (`LOGIN_FAILED`) yazılır.
- **Güvenli görsel URL'leri** — hayvan görseli yalnızca `http(s)` URL kabul eder
  (Zod); `javascript:` / `data:` şemaları reddedilir (CSP `img-src` ile uyumlu).
- **Çift taraflı doğrulama** — Zod şemaları hem istemcide hem her yazma ucunda sunucuda çalışır.
- **Denetim günlüğü** — her yazma işlemi (kim / ne / ne zaman) `AuditLog`'a kaydedilir.
- **Korumalı cron** — bildirim ucu `CRON_SECRET` ile `Authorization` başlığı doğrular.

## 🛠️ Teknolojiler

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- [PostgreSQL](https://www.postgresql.org/) + [Prisma 6](https://www.prisma.io/) (ORM)
- [Auth.js (NextAuth v5)](https://authjs.dev/) — kimlik doğrulama
- [Tailwind CSS](https://tailwindcss.com/) — arayüz
- [Zod](https://zod.dev/) — veri doğrulama
- [Recharts](https://recharts.org/) — grafikler
- [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) — test
- [Docker](https://www.docker.com/) — yerel veritabanı

## Kurulum

### Gereksinimler

- Node.js 20+
- Docker (PostgreSQL için)

### Adımlar

1. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

2. Ortam değişkenlerini ayarlayın — `.env.example` dosyasını `.env` olarak
   kopyalayıp değerleri doldurun:

   ```bash
   cp .env.example .env
   ```

   `AUTH_SECRET` üretmek için:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

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

## Test & Kalite

- **Birim testleri (Vitest):** doğrulama şemaları, RBAC yetkilendirme, hız sınırı,
  liste sorgu parametreleri, finans/harita/tarih/takvim yardımcıları + UI bileşenleri
  (Testing Library: Badge/Button/EmptyState/DataTable/OnboardingModal) — `npm test`
  (200+ test). Kapsam raporu için
  `npm run test:coverage` (iş mantığı `src/lib` için ~%95 satır kapsamı).
- **Uçtan uca testler (Playwright):** kimlik doğrulama, hayvan CRUD akışı ve
  RBAC erişim engeli — `npm run test:e2e` (7 test).
- **CI (GitHub Actions):** her push/PR'da iki paralel job —
  `build` (tsc + ESLint + Vitest + üretim derlemesi) ve
  `e2e` (gerçek PostgreSQL servisi + seed + Playwright).
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

4. **Şemayı üretim DB'sine uygulayın** (ilk deploy'dan önce, yerelden):

   ```bash
   # Migration'lar direct bağlantı üzerinden uygulanır
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run db:deploy
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" \
     ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed-admin
   ```

   Alternatif: Vercel **Build Command**'i `prisma migrate deploy && next build`
   yaparak migration'ı her deploy'da otomatik uygulayabilirsiniz.

5. `main` dalına push → Vercel otomatik derleyip yayınlar.
