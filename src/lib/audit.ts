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
      //
      // NEDEN createMany: `create` her zaman INSERT ... RETURNING uretir ve
      // Postgres, RETURNING bulunan bir INSERT'te donen satira SELECT
      // politikasini da uygular. AuditLog politikasinin USING ifadesi
      // ("tenantId" = current_setting('app.tenant_id', true)) tenantId NULL
      // iken eslesmez, dolayisiyla non-superuser rolle kayit yazilamazdi.
      // createMany RETURNING uretmez; WITH CHECK zaten NULL'a izin veriyor
      // (bkz. migration 20260618163000_tenant_audit_policy).
      await prisma.auditLog.createMany({ data: [{ ...data, tenantId: null }] });
    }
  } catch (error) {
    console.error("Denetim kaydi olusturulamadi:", error);
  }
}

// Toplu islemler icin: N kayit icin N ayri INSERT yerine TEK createMany.
// (Toplu silmede her kayit icin logAudit cagirmak 200 hayvanda 200 ayri
// yazma demekti.) logAudit ile ayni "best-effort" sozlesmesi: hata firlatmaz.
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
    console.error("Toplu denetim kaydi olusturulamadi:", error);
  }
}
