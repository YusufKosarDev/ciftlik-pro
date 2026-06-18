import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Tenant'a kapsanmis Prisma client (Cok-kiracilik Faz 1, app-katmani izolasyon).
//
// Liste/sayim/aggregate/where-tabanli ve create islemlerine otomatik `tenantId`
// enjekte eder; boylece bir tenant baska tenant'in verisini goremez/yazamaz.
//
// SINIR: Unique-hedefli islemler (findUnique / update / delete / upsert) tek bir
// kaydi benzersiz anahtarla hedefler ve where'e `tenantId` eklenemez. Bu islemlerde
// cagiran katman `tenantId`'yi where'e koymali (orn. `where: { id, tenantId }`
// findFirst ile) VEYA uretim sertlestirmesi olarak **Postgres RLS** (DB-seviyesi,
// her islemi garanti eder) eklenmeli. RLS, planin sonraki adimidir.

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
          } else if (operation === "create") {
            a.data = { ...((a.data as object) ?? {}), tenantId };
          } else if (operation === "createMany") {
            const d = a.data;
            a.data = Array.isArray(d)
              ? d.map((x) => ({ ...(x as object), tenantId }))
              : { ...((d as object) ?? {}), tenantId };
          }
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

// Mevcut oturumun tenant'i icin withTenant. Cagiranlar yalnizca sorgularini
// sarar: `const animals = await withCurrentTenant((db) => db.animal.findMany());`
export async function withCurrentTenant<T>(
  fn: (db: Parameters<Parameters<TenantPrisma["$transaction"]>[0]>[0]) => Promise<T>
): Promise<T> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error("Tenant baglami yok (oturum gerekli)");
  return withTenant(tenantId, fn);
}
