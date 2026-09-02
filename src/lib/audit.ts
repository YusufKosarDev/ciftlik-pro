import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";

// Audit log helper. Called AFTER the write it records.
// "Best-effort": it never throws, so a failed audit row cannot break the operation
// it describes; it only logs.
//
// Multi-tenancy: AuditLog is under RLS. When actor.tenantId is present the row is
// written in that tenant's context (withTenant). System events with no tenant
// (LOGIN_FAILED, for instance, which happens before auth) are written with
// tenantId=null; the AuditLog RLS policy permits a NULL write (see the
// tenant_audit_policy migration).

type Actor = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  tenantId?: string | null;
};
type Action = "CREATE" | "UPDATE" | "DELETE" | "LOGIN_FAILED";

export async function logAudit(
  actor: Actor | undefined,
  action: Action,
  entity: string,
  entityId?: string | null,
  summary?: string | null
): Promise<void> {
  const data = {
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? actor?.email ?? "Bilinmiyor",
    action,
    entity,
    entityId: entityId ?? null,
    summary: summary ?? null,
  };
  try {
    if (actor?.tenantId) {
      // Written in the tenant context; tenantId is explicit, so RLS WITH CHECK passes.
      const tenantId = actor.tenantId;
      await withTenant(tenantId, (db) => db.auditLog.create({ data: { ...data, tenantId } }));
    } else {
      // A system record with no tenant (LOGIN_FAILED, for instance).
      //
      // WHY createMany: `create` always emits INSERT ... RETURNING, and on an
      // INSERT with RETURNING Postgres also applies the SELECT policy to the row
      // it returns. The AuditLog policy's USING clause
      // ("tenantId" = current_setting('app.tenant_id', true)) does not match when
      // tenantId is NULL, so the row could not be written under a non-superuser
      // role. createMany emits no RETURNING, and WITH CHECK already allows NULL
      // (see migration 20260618163000_tenant_audit_policy).
      await prisma.auditLog.createMany({ data: [{ ...data, tenantId: null }] });
    }
  } catch (error) {
    console.error("Could not write audit record:", error);
  }
}

// For bulk operations: ONE createMany instead of N separate INSERTs for N rows.
// (Calling logAudit per record during a bulk delete meant 200 separate writes for
// 200 animals.) Same "best-effort" contract as logAudit: it never throws.
export async function logAuditMany(
  actor: Actor | undefined,
  action: Action,
  entity: string,
  items: Array<{ entityId?: string | null; summary?: string | null }>
): Promise<void> {
  if (items.length === 0) return;

  const base = {
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? actor?.email ?? "Bilinmiyor",
    action,
    entity,
  };
  const rows = items.map((item) => ({
    ...base,
    entityId: item.entityId ?? null,
    summary: item.summary ?? null,
  }));

  try {
    if (actor?.tenantId) {
      const tenantId = actor.tenantId;
      await withTenant(tenantId, (db) =>
        db.auditLog.createMany({ data: rows.map((r) => ({ ...r, tenantId })) })
      );
    } else {
      await prisma.auditLog.createMany({
        data: rows.map((r) => ({ ...r, tenantId: null })),
      });
    }
  } catch (error) {
    console.error("Could not write bulk audit records:", error);
  }
}
