import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";

// Denetim gunlugu yardimcisi. Yazma islemlerinden SONRA cagrilir.
// "Best-effort": kayit basarisiz olsa bile asil islemi bozmamak icin
// hata firlatmaz, yalnizca loglar.
//
// Cok-kiracilik: AuditLog'da RLS var. actor.tenantId varsa kayit o tenant'in
// baglaminda (withTenant) yazilir. Tenant'siz sistem olaylari (orn. LOGIN_FAILED,
// auth oncesi) tenantId=null ile yazilir; AuditLog RLS politikasi NULL yazimina
// izin verir (bkz. tenant_audit_policy migration'i).

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
      // Tenant baglaminda yaz; tenantId acikca verilir, RLS WITH CHECK gecer.
      const tenantId = actor.tenantId;
      await withTenant(tenantId, (db) => db.auditLog.create({ data: { ...data, tenantId } }));
    } else {
      // Tenant'siz sistem kaydi (orn. LOGIN_FAILED).
      await prisma.auditLog.create({ data: { ...data, tenantId: null } });
    }
  } catch (error) {
    console.error("Denetim kaydi olusturulamadi:", error);
  }
}
