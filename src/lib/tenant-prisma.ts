import { prisma } from "@/lib/prisma";

// Tenant-scoped Prisma client (multi-tenancy phase 1, application-layer isolation).
//
// Injects `tenantId` into every list / count / aggregate / where-based operation,
// so one tenant cannot read or write another tenant's data.
//
// On WRITES (create) the caller passes tenantId explicitly; the type system makes
// that mandatory (tenantId is NOT NULL on 17 tables). A write with a wrong or
// missing tenantId is rejected by the Postgres RLS WITH CHECK policy — the
// database-level guarantee. One mechanism, stated once: explicit tenantId plus RLS.
//
// LIMIT: unique-targeted operations (findUnique / update / delete / upsert) address
// a single row by a unique key and cannot take `tenantId` in their where. For those
// the calling layer must put `tenantId` in the where itself (e.g. `where: { id }`
// via findFirst, where the forTenant scope already hides the row) OR rely on
// Postgres RLS, which covers every operation.

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
          // The Tenant table itself is not scoped.
          if (model === "Tenant") return query(args);

          const a = (args ?? {}) as Record<string, unknown>;
          if (WHERE_OPS.has(operation)) {
            a.where = { ...((a.where as object) ?? {}), tenantId };
          }
          // create/createMany: the caller passes tenantId explicitly (enforced by
          // the type system, checked again by RLS WITH CHECK). Nothing is injected
          // here.
          return query(a);
        },
      },
    },
  });
}

export type TenantPrisma = ReturnType<typeof forTenant>;

// Runs a unit of work tenant-scoped by establishing the RLS context: sets the
// `app.tenant_id` GUC with SET LOCAL inside an interactive transaction
// (pgbouncer-safe) and hands back a forTenant-injected tx. When the application
// connects as a NON-SUPERUSER role in production, Postgres RLS then hides every
// row outside that context — findUnique / update / delete included.
// Callers: `await withTenant(session.user.tenantId, (db) => db.animal.findMany())`.
export async function withTenant<T>(
  tenantId: string,
  fn: (db: Parameters<Parameters<TenantPrisma["$transaction"]>[0]>[0]) => Promise<T>,
  // Long-running batch jobs (e.g. seeding the showcase dataset) can raise the
  // transaction timeout. Request paths keep Prisma's defaults; this only changes
  // when passed explicitly.
  options?: { timeout?: number; maxWait?: number }
): Promise<T> {
  return forTenant(tenantId).$transaction(async (tx) => {
    // set_config(name, value, is_local=true) === SET LOCAL (transaction-scoped).
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  }, options);
}

// The scoped tx type passed to withTenant's fn (shorthand for callers).
export type TenantDb = Parameters<Parameters<TenantPrisma["$transaction"]>[0]>[0];
