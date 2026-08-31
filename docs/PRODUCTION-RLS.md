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

## 1. Migration'ları sahip/superuser ile çalıştırın

Şema değişiklikleri (DDL) `ciftlik_app` rolünün yetkisinde değildir — bu kasıtlıdır.
`prisma migrate deploy`'u **sahip** bağlantısıyla çalıştırın (genelde Prisma'nın
`DIRECT_URL`'i). Uygulama runtime'ı ise `ciftlik_app` ile bağlanır.

> **Bu adım önce gelmelidir.** Sonraki adımdaki betik `GRANT ... ON ALL TABLES`
> ve adıyla üç fonksiyona `GRANT EXECUTE` verir; bunlar **mevcut** nesnelere
> uygulanır. Şema henüz yoksa rol yetkisiz kalır ya da betik "function does not
> exist" ile düşer. CI de bu sırayı uyguluyor (`.github/workflows/ci.yml`).

## 2. Non-superuser uygulama rolünü oluşturun

`prisma/rls-app-role.sql` betiği `ciftlik_app` adında, `NOSUPERUSER` +
`NOBYPASSRLS` bir rol oluşturur ve gerekli (DDL olmayan) yetkileri verir.
Idempotenttir; tekrar çalıştırılabilir.

Superuser veya veritabanı sahibiyle, uygulama veritabanına bağlıyken çalıştırın:

```bash
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -v app_pw='GÜÇLÜ_BIR_PAROLA' \
  -f prisma/rls-app-role.sql
```

Betik sonunda `rolsuper`, `rolbypassrls`, `rolcreatedb`, `rolcreaterole`
sütunlarını basar — **dördü de `f` olmalıdır** — ve `rolbypassrls` doğruysa sesli
bir `WARNING` verir.

> **Öznitelik adımı düşebilir, bu beklenen bir durumdur.** PostgreSQL'de
> `SUPERUSER` özniteliğini değiştirmek (kapatmak dahil) gerçek superuser
> gerektirir; Neon'da bağlanılabilen en yetkili rol `neondb_owner`'dır ve
> `rolsuper = false`'tur. Betik bu yüzden her özniteliği ayrı, hata toleranslı
> bir blokta dener ve `[atlandi] ...` diye not düşer. Yeni oluşturulan rol bu
> özniteliklerin hepsini zaten doğru değerlerle taşıdığından kurulum geçerlidir —
> son doğrulama çıktısı gerçeği söyler.

> ⚠️ **Tekrar çalıştırırken aynı parolayı verin.** `ALTER ROLE` parolayı koşulsuz
> yeniden yazar; farklı bir değer verilirse `DATABASE_URL` güncellenene kadar tüm
> bağlantılar kimlik doğrulamada düşer.

> ⚠️ **`ALTER DEFAULT PRIVILEGES` `FOR ROLE` taşımıyor.** Betikteki varsayılan
> yetkiler yalnızca **betiği çalıştıran rolün** oluşturacağı nesnelere uygulanır.
> Bu betiği ve `prisma migrate deploy`'u **aynı rolle** (Neon'da `neondb_owner`)
> çalıştırın; aksi halde sonraki migration'ların eklediği tablolarda
> `ciftlik_app` yetkisiz kalır ve o tablolara ilk erişimde `permission denied`
> alırsınız. Farklı bir rol kullanacaksanız betikteki üç `ALTER DEFAULT
> PRIVILEGES` satırını `FOR ROLE <owner>` ile nitelendirin.

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

<a id="neon-limitation"></a>

## Neon üzerinde bilinen kısıt

Yukarıdaki adımlar, rol yönetiminin sizde olduğu bir PostgreSQL'de çalışır.
**Neon'un ücretsiz katmanında çalışmaz** ve bunu üretimde keşfetmemeniz için
buraya yazıyoruz. Denenen iki yol var; ikisi de kapalı.

### Kapı 1 — Rolü SQL ile oluşturmak

`prisma/rls-app-role.sql` beklendiği gibi çalışır: rol oluşur, `rolsuper = f`,
`rolbypassrls = f`, tablo/sekans/fonksiyon yetkileri verilir. Postgres tarafında
hiçbir eksik yoktur — parola `scram-sha-256` ile saklanır, `LOGIN` açıktır,
`CONNECT` yetkisi vardır.

Ama bu rolle **bağlanılamaz**:

```
password authentication failed for user "ciftlik_app"
```

Sebep Postgres değil, Neon'un önündeki bağlantı proxy'si: kimlik doğrulamayı
kendi kontrol düzlemine karşı yapıyor ve SQL ile oluşturulmuş bir rolü
tanımıyor. Aynı host, aynı parametreler ve aynı sürücüyle `neondb_owner`
bağlanabiliyor — değişen tek şey kullanıcı adı.

> `SET ROLE ciftlik_app` da bir çıkış yolu değil: PostgreSQL 16'dan itibaren
> `CREATEROLE` ile oluşturulan role otomatik verilen üyelik yalnızca `ADMIN`
> seçeneğini taşır. `SET` seçeneği `createrole_self_grant` GUC'una bağlıdır ve
> varsayılanı boştur, dolayısıyla `permission denied to set role "ciftlik_app"`
> alırsınız.

### Kapı 2 — Rolü Neon Console'dan oluşturmak

Console'dan oluşturulan rol proxy tarafından tanınır ve **bağlanabilir**. Ancak
Neon bu rolü otomatik olarak `neon_superuser` grubuna üye yapar, rol de o grubun
`BYPASSRLS` özniteliğini devralır. Yani bağlanabilen rol, RLS'i aşan roldür.

Üyeliği kaldırmayı denemek de sonuç vermez:

```
REVOKE neon_superuser FROM ciftlik_app;
→ ERROR: permission denied to revoke role
```

Bu kısıt Neon'un kontrol düzleminde uygulanıyor; veritabanının içinden
aşılabilir bir şey değil.

### Sonuç ve etkisi

Neon ücretsiz katmanında **RLS'e tabi bir uygulama rolü oluşturulamıyor**:
bağlanabilen rol bypass ediyor, bypass etmeyen rol bağlanamıyor.

Bunun anlamı, kaybedilenin ne olduğu konusunda net olmak gerekirse:

| | Durum |
| --- | --- |
| RLS politikaları | 21 tabloda `ENABLE` + `FORCE` + `tenant_isolation`, **tanımlı ve doğru** |
| CI doğrulaması | Her push'ta `ciftlik_app` (`NOSUPERUSER NOBYPASSRLS`) ile **6 RLS testi** koşuyor (`src/lib/tenant-rls.int.test.ts`) |
| Barındırılan demo | İkinci katman **uykuda** — bağlantı `BYPASSRLS` taşıyan bir rolle |
| Uygulama katmanı | Prisma extension + `withTenant` + `SET LOCAL` — demoda da **etkin** |

Yani izolasyon demoda tek katmana iniyor. Bu, tasarımın değil barındırmanın
sınırı: rol yönetiminin sizde olduğu herhangi bir PostgreSQL'de (ücretli Neon
planı, Supabase, kendi sunucunuz) yukarıdaki adımlar olduğu gibi çalışır ve
ikinci katman açılır. SQL de testler de hazır; değişen tek şey bağlantı dizesi.

## Bağlamsız okumalar: giriş, davet bağlantısı ve mağaza dizini

İki okuma, tenant bağlamı **var olmadan** önce gerçekleşmek zorundadır; ikisi de
`SECURITY DEFINER` fonksiyonlarla çözülür. Fonksiyon **sahibinin** yetkileriyle
çalışır ve RLS'i yalnızca o tek arama için bypass eder:

| Fonksiyon | Migration | Neden bağlamsız |
| --- | --- | --- |
| `auth_user_by_email(text)` | `20260618167000_auth_lookup_function` | Giriş, kullanıcıyı e-postayla bulana kadar tenant'ı bilmez; `User`'da FORCE RLS olduğu için non-superuser rol doğrudan 0 satır görürdü. |
| `invitation_by_token(text)` | `20260826120000_invitation_rls` | Davet bağlantısı herkese açıktır (kullanıcı henüz giriş yapmamıştır); `Invitation` da FORCE RLS altındadır. Fonksiyon **token'ın kendisini döndürmez**. |
| `public_storefront_tenants()` | `20260830120000_public_storefront_function` | `/magaza` dizini tasarım gereği kiracılar arasıdır ve ziyaretçi giriş yapmamıştır; `Product` FORCE RLS altında olduğundan doğrudan sorgu 0 satır dönerdi. Fonksiyon `Product`'a yalnızca bir `EXISTS` alt sorgusunda dokunur (seçim listesi sabit `1`), yani **hiçbir ürün alanı döndürmez**; sadece aktif ürünü olan çiftliğin `id`/`name`/`slug`'ı döner. |

Her ikisi de tek bir eşitlikle filtreler (enumerasyona yardım etmez) ve yalnızca
gereken minimum alanları döndürür.

> Fonksiyonların **sahibi**, RLS'i bypass eden bir rol olmalıdır (migration'ı
> çalıştıran owner/superuser; managed Postgres'te proje sahibi rolü genelde
> bypass eder). Migration'ları bu rolle çalıştırmak yeterlidir.

Kayıt (`/api/auth/signup`) ve davet kabulü (`/api/invitations/[token]/accept`)
yeni kullanıcıyı yazmadan önce aynı transaction'da `set_config('app.tenant_id', …)`
ile bağlamı ayarlar; böylece `WITH CHECK` politikası geçerek non-superuser rolle
de çalışır — davetin `acceptedAt` güncellemesi de bu bağlamın içindedir.

## Notlar

- `tenantId` yalnızca `AuditLog`'da **nullable**'dır: sistem kayıtları (örn.
  `LOGIN_FAILED`) tenant'sız olabilir, bu yüzden politikasının `WITH CHECK`'i
  `NULL` yazımına da izin verir (`20260618163000_tenant_audit_policy`). Diğer
  20 tenant tablosunda `NOT NULL`'dur — `Order`/`OrderItem` dahil
  (`20260618168000_order_rls_notnull`).
- Yeni bir tenant tablosu eklerken: migration'a `ENABLE`/`FORCE ROW LEVEL SECURITY`
  + `tenant_isolation` politikasını ekleyin. `ALTER DEFAULT PRIVILEGES` sayesinde
  `ciftlik_app` yeni tablolarda otomatik DML yetkisi alır.
