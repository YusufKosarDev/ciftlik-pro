# Üretimde Row-Level Security (RLS) — Non-Superuser Rol Kurulumu

Çok-kiracılık (multi-tenant) izolasyonu iki katmanla sağlanır:

1. **Uygulama katmanı** — `withTenant(tenantId, …)` her isteği bir interaktif
   transaction içinde çalıştırır ve `SET LOCAL app.tenant_id` ile tenant bağlamını
   ayarlar; `forTenant` okuma sorgularına `tenantId` filtresi enjekte eder.
2. **Veritabanı katmanı (asıl garanti)** — Postgres RLS, her tenant tablosunda
   `tenant_isolation` politikasıyla bağlam dışındaki satırları gizler ve yanlış
   `tenantId` yazımını reddeder (`USING` + `WITH CHECK`). Bağlam ayarlı değilse
   hiçbir satır görünmez (**fail-closed**).

> ⚠️ **Kritik:** PostgreSQL'de **superuser** ve (varsayılan olarak) **tablo
> sahibi** RLS'i **bypass eder**. Tablolarımızda `FORCE ROW LEVEL SECURITY`
> etkin olduğundan sahip de politikaya tabidir; yine de uygulama **asla**
> superuser ile bağlanmamalıdır. Aksi halde RLS hiç uygulanmaz ve tenant'lar
> birbirinin verisini görebilir.

## 1. Non-superuser uygulama rolünü oluşturun

`prisma/rls-app-role.sql` betiği `ciftlik_app` adında, `NOSUPERUSER` +
`NOBYPASSRLS` bir rol oluşturur ve gerekli (DDL olmayan) yetkileri verir.
Idempotenttir; tekrar çalıştırılabilir.

Superuser veya veritabanı sahibiyle, uygulama veritabanına bağlıyken çalıştırın:

```bash
psql "$DIRECT_URL" -v app_pw='GÜÇLÜ_BIR_PAROLA' -f prisma/rls-app-role.sql
```

Betik sonunda rolün `rolsuper = f` ve `rolbypassrls = f` olduğunu doğrular.

## 2. Migration'ları yine sahip/superuser ile çalıştırın

Şema değişiklikleri (DDL) `ciftlik_app` rolünün yetkisinde değildir — bu kasıtlıdır.
`prisma migrate deploy`'u **sahip** bağlantısıyla çalıştırın (genelde Prisma'nın
`DIRECT_URL`'i). Uygulama runtime'ı ise `ciftlik_app` ile bağlanır.

## 3. Uygulama bağlantı URL'lerini güncelleyin

Runtime bağlantılarını non-superuser role çevirin:

```bash
# Havuzlanmış (pgbouncer/pooler) — uygulama sorguları
DATABASE_URL="postgresql://ciftlik_app:GÜÇLÜ_BIR_PAROLA@HOST:PORT/DB?schema=public&pgbouncer=true"

# Doğrudan bağlantı — yalnızca migration/DDL için (sahip rolü kalabilir)
DIRECT_URL="postgresql://OWNER:OWNER_PW@HOST:PORT/DB?schema=public"
```

`withTenant`, `set_config(..., true)` (transaction-local) kullandığından
pgbouncer **transaction** modu ile uyumludur.

## 4. Doğrulama

Role doğrudan bağlanıp izolasyonu kontrol edin:

```bash
# Bağlam yok → 0 satır (fail-closed)
PGPASSWORD=… psql -U ciftlik_app -d DB -h HOST -c 'SELECT count(*) FROM "Animal";'

# Bağlam var → yalnızca o tenant'ın satırları
PGPASSWORD=… psql -U ciftlik_app -d DB -h HOST \
  -c "BEGIN; SELECT set_config('app.tenant_id','<TENANT_ID>',true);
      SELECT count(*) FROM \"Animal\"; COMMIT;"
```

Otomatik kanıt için entegrasyon testleri (gerçek DB gerektirir):

```bash
RUN_DB_TESTS=1 \
APP_USER_DATABASE_URL="postgresql://ciftlik_app:…@HOST:PORT/DB?schema=public" \
npx vitest run src/lib/tenant-rls.int.test.ts
```

## Giriş (login) ve RLS

Kimlik doğrulama, tenant **bilinmeden** (bağlam ayarlanmadan) kullanıcıyı
e-postayla bulmak zorundadır — `User`'da FORCE RLS olduğundan non-superuser rol
doğrudan 0 satır görürdü. Bunun için `auth_user_by_email(text)` adında bir
**`SECURITY DEFINER`** fonksiyonu kullanılır (migration
`20260618167000_auth_lookup_function`): fonksiyon, **sahibinin** yetkileriyle
çalışır ve RLS'i yalnızca bu tek e-posta araması için bypass eder.

> Fonksiyonun **sahibi**, RLS'i bypass eden bir rol olmalıdır (migration'ı
> çalıştıran owner/superuser; managed Postgres'te proje sahibi rolü genelde
> bypass eder). Migration'ları bu rolle çalıştırmak yeterlidir.

Kayıt (`/api/auth/signup`) ve davet kabulü (`/api/invitations/[token]/accept`)
yeni kullanıcıyı yazmadan önce aynı transaction'da `set_config('app.tenant_id', …)`
ile bağlamı ayarlar; böylece `WITH CHECK` politikası geçerek non-superuser rolle
de çalışır. `Invitation` tablosu RLS dışıdır (token ile public okuma).

## Notlar

- `AuditLog`, `Order`, `OrderItem` kolonları `tenantId` için hâlâ **nullable**'dır:
  `AuditLog` sistem kayıtları (örn. `LOGIN_FAILED`) tenant'sız olabilir;
  `Order`/`OrderItem` ise per-tenant vitrin (Faz 4) tamamlanana kadar ertelenmiştir.
- Yeni bir tenant tablosu eklerken: migration'a `ENABLE`/`FORCE ROW LEVEL SECURITY`
  + `tenant_isolation` politikasını ekleyin. `ALTER DEFAULT PRIVILEGES` sayesinde
  `ciftlik_app` yeni tablolarda otomatik DML yetkisi alır.
