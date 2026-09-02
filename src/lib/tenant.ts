import { auth } from "@/lib/auth";
import { withTenant, type TenantDb } from "@/lib/tenant-prisma";

// withTenant for the current session's tenant. Callers only wrap their query:
// `const animals = await withCurrentTenant((db) => db.animal.findMany());`
//
// Note: kept separate from tenant-prisma.ts because of the auth() dependency, so
// that modules used by auth itself (audit.ts, for instance) can import withTenant
// without creating a cycle.
export async function withCurrentTenant<T>(fn: (db: TenantDb) => Promise<T>): Promise<T> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new Error("Tenant baglami yok (oturum gerekli)");
  return withTenant(tenantId, fn);
}
