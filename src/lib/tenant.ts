import { auth } from "@/lib/auth";
import { withTenant, type TenantDb } from "@/lib/tenant-prisma";

// Mevcut oturumun tenant'i icin withTenant. Cagiranlar yalnizca sorgularini
// sarar: `const animals = await withCurrentTenant((db) => db.animal.findMany());`
//
// Not: auth() bagimliligi nedeniyle tenant-prisma.ts'ten ayri tutulur (audit.ts
// gibi auth tarafindan kullanilan moduller dongusuz withTenant'i import edebilsin).
export async function withCurrentTenant<T>(fn: (db: TenantDb) => Promise<T>): Promise<T> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error("Tenant baglami yok (oturum gerekli)");
  return withTenant(tenantId, fn);
}
