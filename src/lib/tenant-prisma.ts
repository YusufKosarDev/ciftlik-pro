import { prisma } from "@/lib/prisma";

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
