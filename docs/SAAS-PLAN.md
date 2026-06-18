# 🏢 Çiftlik Pro — SaaS (Çok-Kiracılı) Dönüşüm Planı

> Mimari taslak. Mevcut **tek çiftlik / iç ekip** modelinden, **her çiftlik
> sahibinin kayıt olup kendi izole çiftliğini (tenant) yönettiği** çok-kiracılı
> SaaS modeline geçiş için yol haritası. Bu bir plandır; uygulama faz faz yapılır.

## 1. Hedef

Bir tenant'ın verisi başka bir tenant'a **asla** sızmamalı. Kayıt herkese açılır
(çiftlik sahibi kendi hesabını/çiftliğini oluşturur); personel ise tenant içinde
davetle eklenir.

## 2. Temel mimari kararlar (önerilerle)

| Karar | Seçenekler | **Öneri (v1)** |
| ----- | ---------- | -------------- |
| **İzolasyon** | DB-per-tenant · schema-per-tenant · **satır-seviyesi (`tenantId` kolonu)** | **Satır-seviyesi** (paylaşımlı DB/şema) — Prisma + Postgres ile en pragmatik; ölçeklenince ayrıştırılır |
| **Tenant çözümleme** | Subdomain (`acme.app.com`) · path (`/t/acme`) · **oturumdan (`tenantId` JWT'de)** | **Oturumdan** — URL/altyapı değişikliği yok; subdomain Faz 4'e |
| **Kullanıcı ↔ Tenant** | Çoklu üyelik (`Membership` tablosu) · **tek tenant (`User.tenantId`)** | **Tek tenant** (v1 sadelik); e-posta global unique. Çoklu-org gerekirse `Membership`'e yükseltilir |
| **İzolasyon zorlaması** | Sadece app-katmanı · **Postgres RLS + app** | **RLS (DB-seviyesi) + `tenantId` filtreleri** — RLS, unutmayı imkânsız kılar (savunma derinliği) |

## 3. Veri modeli değişiklikleri

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String              // Çiftlik/işletme adı
  slug      String   @unique    // acme (subdomain/URL için, ileride)
  plan      Plan     @default(FREE)
  createdAt DateTime @default(now())
  users     User[]
  // ... tüm tenant-kapsamlı ilişkiler
}

enum Plan { FREE PRO }
```

- **Her tenant-kapsamlı tabloya `tenantId String` + ilişki** (Animal, Field,
  Inventory, Transaction, Sale, Customer, Product, Order, Task, Structure,
  AuditLog, User …). Her birinde `@@index([tenantId])`.
- **Unique kısıtlar per-tenant olur:** `Animal.tagNumber @unique` →
  `@@unique([tenantId, tagNumber])`. Aynısı `Sale.transactionId`, yapı adları vb.
- **`User.email`:** global unique kalır (tek login kimliği), ancak `User.tenantId`
  ile bir tenant'a bağlanır.

## 4. İzolasyonun zorlanması (EN KRİTİK kısım)

İki katman:

1. **Postgres RLS (Row-Level Security)** — her tenant-tablosunda policy:
   `tenantId = current_setting('app.tenant_id')`. Sorgu nereyi unutursa unutsun
   veritabanı sızdırmaz.
   - **Caveat (pgbouncer):** havuzlanmış bağlantıda session değişkeni kalıcı
     olmaz → tenant, **interaktif `$transaction` içinde `SET LOCAL app.tenant_id`**
     ile ayarlanır. Bu, Prisma + Neon/Supabase + RLS'in bilinen desenidir.
2. **App-katmanı `tenantId` filtreleri** — ergonomi için. Bir **Prisma Client
   Extension (`$extends`)** ile `where`/`create`'e otomatik `tenantId` enjekte
   edilir; geliştirici elle yazmayı unutsa bile eklenir.

> Mevcut kod RSC sayfalarında `prisma`'yı doğrudan okuyor — hepsi **istek-kapsamlı,
> tenant-bilinçli bir client** üzerinden geçmeli (request context'ten `tenantId`).

## 5. Auth & oturum

- `src/lib/auth.config.ts` JWT callback'ine **`tenantId`** eklenir (rol gibi);
  `session.user.tenantId` her yerde kullanılır.
- `src/proxy.ts` / `src/lib/authz.ts`: yetki kontrolleri **tenant içinde** anlam
  kazanır (ADMIN = kendi tenant'ının admini).
- `src/lib/prisma.ts`: tek singleton yerine **istek başına tenant-scoped client**
  (RLS için `SET LOCAL`).

## 6. Kayıt & onboarding akışı (yeni)

- **Public "Çiftlik oluştur" kaydı** (`/kayit`): tek `$transaction`'da
  **Tenant + ilk ADMIN (sahip)** oluşturur → boş çiftliğe girer. (Opsiyonel
  e-posta doğrulama.)
- **Mevcut admin-only `/api/auth/register`** → **tenant-içi personel daveti**ne
  dönüşür: sahip e-posta ile davet eder, davetli parolasını belirler (token'lı
  `Invitation` modeli).
- Giriş ekranına "Demo olarak gez" + **"Kayıt ol / Çiftlik oluştur"** eklenir.

## 7. Faturalandırma (Stripe Billing) — Faz 3

- Stripe **Subscriptions** (FREE/PRO planları), **seat/limit** (örn. plan başına
  hayvan/personel sayısı), trial, customer portal.
- Webhook: abonelik durumu → `Tenant.plan`. Plan limitleri yazma uçlarında
  zorlanır (zaten kurulu `/api/stripe/webhook` deseni genişletilir).

## 8. Diğer dokunuşlar

- **Mağaza per-tenant:** her çiftliğin kendi kataloğu → `/{slug}/magaza` veya
  subdomain; public `/api/orders` tenant'a göre çözümlenir.
- **Cron/bildirim:** günlük uyarılar **tenant döngüsünde** çalışır (her tenant'ın
  admin'lerine).
- **AuditLog:** `tenantId` ile kapsanır.
- **Demo:** ya paylaşımlı bir "demo tenant" ya da ziyaretçi başına geçici tenant.

## 9. Mevcut veriyi taşıma (migration)

1. `Tenant` + nullable `tenantId` ekle.
2. Bir **"default tenant"** oluştur; tüm mevcut satırları + kullanıcıları ona ata
   (backfill SQL).
3. `tenantId`'yi **NOT NULL** yap + per-tenant unique kısıtları ekle + RLS
   policy'lerini aç.

   (Üç ayrı migration; geri-dönüşü güvenli.)

## 10. Fazlı yol haritası

- **Faz 1 — Temel çok-kiracılık:** `Tenant` modeli, `tenantId` + RLS + scoped
  client, oturuma `tenantId`, mevcut veri backfill. _(Çekirdek; en riskli /
  izolasyon kritik.)_
- **Faz 2 — Kayıt & davet:** public çiftlik kaydı, personel davet akışı, onboarding.
- **Faz 3 — Faturalandırma:** Stripe Billing, planlar/limitler, customer portal.
- **Faz 4 — Subdomain & per-tenant mağaza:** wildcard domain, tenant-bazlı vitrin, marka.
- **Faz 5 — Operasyon:** tenant başına metrik/loglama, veri ihracı/silme
  (KVKK/GDPR), süper-admin paneli.

## 11. Riskler & tradeoff'lar

- **#1 risk — veri sızıntısı.** Tek bir tenant'sız sorgu = ihlal. **RLS şart**
  (yalnızca app-filtre yetmez). İzolasyon e2e testleri yazılmalı (Tenant A,
  Tenant B'nin verisini göremez).
- **pgbouncer + RLS** session-değişkeni inceliği (yukarıda `SET LOCAL` +
  interaktif transaction).
- **Geniş dokunuş:** her sorgu / şema / unique kısıt etkilenir — Faz 1 büyük ve
  dikkatli olmalı; test kapsamı (özellikle izolasyon) kritik.
- **Tek-tenant → çoklu-üyelik** sonradan istenirse `Membership` tablosuna geçiş
  gerekir (e-posta / login modeli değişir) — v1'de bilinçli olarak basit tutuldu.

## 12. Uygulama durumu (`feat/saas-phase1` dalı)

**Faz 1 — büyük ölçüde tamamlandı** (mağaza hariç). `main`'e merge edilmedi;
CV-hazır canlı demo korunuyor.

- ✅ `Tenant` modeli + `Plan` enum; 20 tabloya `tenantId`; `Animal.tagNumber`
  per-tenant unique (`@@unique([tenantId, tagNumber])`).
- ✅ Migration zinciri: ekleme → backfill (default-tenant) → RLS (ENABLE+FORCE +
  `tenant_isolation`) → AuditLog NULL politikası → **`tenantId` NOT NULL** (17
  tablo). `AuditLog`/`Order`/`OrderItem` bilinçli nullable.
- ✅ Scoped client: `forTenant` (okuma `where` enjeksiyonu) + `withTenant`
  (interaktif transaction + `SET LOCAL app.tenant_id`, pgbouncer-uyumlu).
- ✅ Yazma yolları: tenantId **açıkça** verilir (tip-zorunlu); RLS `WITH CHECK`
  DB-seviyesi garanti. Tüm panel sayfaları + yazma rotaları + register +
  profil + denetim adapte edildi.
- ✅ Oturum: JWT/session'da `tenantId`.
- ✅ Cron uyarıları **tenant döngüsünde** çalışır (her tenant'ın admin'lerine).
- ✅ İzolasyon e2e testleri (gerçek DB, non-superuser rol): `forTenant`
  izolasyonu, per-tenant tag tekrarı, RLS `findUnique` sızıntı yok, fail-closed.
- ✅ **Üretim non-superuser rolü:** `prisma/rls-app-role.sql` + kurulum rehberi
  [`docs/PRODUCTION-RLS.md`](./PRODUCTION-RLS.md).

**Faz 2 — tamamlandı:**

- ✅ Public **"çiftlik oluştur"** kaydı (`/kayit` + `POST /api/auth/signup`): tek
  transaction'da Tenant + ilk ADMIN; benzersiz slug; RLS-uyumlu (yeni tenant
  bağlamı `set_config` ile ayarlanıp ADMIN yazılır); e-posta çakışması P2002→409.
- ✅ **Personel davet akışı:** `Invitation` modeli (RLS dışı, token ile public
  erişim), ADMIN davet oluşturma/iptal (`/api/invitations`), token'lı public
  kabul (`/davet/[token]` + `/api/invitations/[token]/accept`) → davetli adını/
  parolasını belirler, otomatik giriş. Personel sayfasında davet formu + bekleyen
  davetler listesi.
- ✅ **Login RLS uyumu:** `auth_user_by_email` SECURITY DEFINER fonksiyonu —
  giriş, tenant bilinmeden non-superuser rolle de kullanıcıyı bulur.

**Faz 4 — tamamlandı (path tabanlı vitrin):**

- ✅ **Tenant çözümleme: path `/magaza/[slug]`** (subdomain değil — DNS/altyapı
  gerektirmez, Vercel'de ve localde çalışır). `/magaza` çiftlik dizinidir;
  `/magaza/[slug]` o çiftliğin kataloğu; sepet slug'a özel localStorage anahtarı.
- ✅ `Order`/`OrderItem` artık **tenantId NOT NULL** (RLS zaten 20 tabloyu
  kapsıyordu). Sipariş, slug→tenant çözümüyle `withTenant` içinde oluşturulur;
  ürün doğrulaması tenant-kapsamlı. Stripe metadata'sına `tenantId` yazılır;
  webhook siparişi o tenant bağlamında günceller. seed/seed-demo tenantId'li.

**Performans — tamamlandı:**

- ✅ Her tenant-tablosunda `@@index([tenantId])` (RLS + forTenant her sorguya
  `tenantId` filtresi enjekte ettiğinden). Animal (zaten `@@unique([tenantId,
  tagNumber])` tenantId-öncülü) ve Invitation (zaten index'li) hariç 19 tablo.

**Kalan:**

- ⏳ **Faz 3 / 5** — faturalandırma, operasyon (KVKK ihraç/silme, süper-admin).
- ⏳ (Opsiyonel) Vitrin dizini cross-tenant ürün sayısı için SECURITY DEFINER
  fonksiyonu — şu an tüm tenant'lar listeleniyor (boş vitrinler de).

---

_Durum: Faz 1 uygulandı (`feat/saas-phase1`). Sonraki fazlar onaylandıkça parça
parça yapılacaktır._
