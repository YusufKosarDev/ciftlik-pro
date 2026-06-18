import { prisma } from "@/lib/prisma";

// Tenant'a kapsanmis Prisma client (Cok-kiracilik Faz 1, app-katmani izolasyon).
//
// Liste/sayim/aggregate/where-tabanli islemlere otomatik `tenantId` enjekte eder;
// boylece bir tenant baska tenant'in verisini goremez/yazamaz.
//
// YAZMA islemlerinde (create) tenantId, cagiran tarafindan acikca verilir; tip
// sistemi bunu zorunlu kilar (tenantId 17 tabloda NOT NULL). Yanlis/eksik tenantId
// ile yazma, Postgres RLS WITH CHECK politikasi tarafindan reddedilir (DB-seviyesi
// garanti). Boylece tek ve net mekanizma: acik tenantId + RLS.
//
// SINIR: Unique-hedefli islemler (findUnique / update / delete / upsert) tek bir
// kaydi benzersiz anahtarla hedefler ve where'e `tenantId` eklenemez. Bu islemlerde
// cagiran katman `tenantId`'yi where'e koymali (orn. `where: { id }` findFirst ile,
// RLS kapsami zaten satiri gizler) VEYA Postgres RLS her islemi garanti eder.

const WHERE_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

export function forTenant(tenantId: string) {
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Tenant tablosunun kendisi kapsanmaz.
          if (model === "Tenant") return query(args);

          const a = (args ?? {}) as Record<string, unknown>;
          if (WHERE_OPS.has(operation)) {
            a.where = { ...((a.where as object) ?? {}), tenantId };
          }
          // create/createMany: tenantId cagiran tarafindan acikca verilir (tip
          // zorunlulugu + RLS WITH CHECK). Burada enjeksiyon yapilmaz.
          return query(a);
        },
      },
    },
  });
}

export type TenantPrisma = ReturnType<typeof forTenant>;

// RLS baglamini ayarlayarak tenant-kapsamli calistirir: interaktif transaction
// icinde `app.tenant_id` GUC'unu SET LOCAL eder (pgbouncer uyumlu) ve forTenant
// enjeksiyonlu tx verir. Uretimde uygulama NON-SUPERUSER rolle baglandiginda
// Postgres RLS, bu baglam disindaki tum satirlari gizler (findUnique/update/delete
// dahil). Cagiranlar: `await withTenant(session.user.tenantId, (db) => db.animal.findMany())`.
export async function withTenant<T>(
  tenantId: string,
  fn: (db: Parameters<Parameters<TenantPrisma["$transaction"]>[0]>[0]) => Promise<T>
): Promise<T> {
  return forTenant(tenantId).$transaction(async (tx) => {
    // set_config(name, value, is_local=true) === SET LOCAL (transaction kapsamli).
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

// withTenant'in fn'ine gecen kapsanmis tx tipi (cagiranlar icin kisayol).
export type TenantDb = Parameters<Parameters<TenantPrisma["$transaction"]>[0]>[0];
