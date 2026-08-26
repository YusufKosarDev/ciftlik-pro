import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";
import { logAudit } from "@/lib/audit";

// DELETE /api/tenant -> ADMIN, kendi tenant'ini ve TUM verisini kalici siler
// (hesap kapatma / KVKK silme hakki). Onay: govdedeki `confirm` ciftlik adina
// birebir esit olmali. Demo ciftligi (default-tenant) korunur.
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yalnizca yonetici çiftliği silebilir" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  // Vitrin/demo verisini korumak icin varsayilan tenant silinemez.
  if (tenantId === "default-tenant") {
    return NextResponse.json(
      { error: "Demo çiftliği silinemez" },
      { status: 403 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant bulunamadi" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.confirm !== tenant.name) {
    return NextResponse.json(
      { error: "Onay metni çiftlik adıyla eşleşmiyor" },
      { status: 400 }
    );
  }

  // Tum tenant verisini FK-guvenli sirayla sil (cocuk -> ebeveyn). Her deleteMany
  // forTenant tarafindan tenantId ile kapsanir; RLS de DB-seviyesinde sinirlar.
  await withTenant(tenantId, async (db) => {
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.sale.deleteMany({});
    await db.transaction.deleteMany({});
    await db.feedLog.deleteMany({});
    await db.inventoryItem.deleteMany({});
    await db.healthRecord.deleteMany({});
    await db.vaccination.deleteMany({});
    await db.milkYield.deleteMany({});
    await db.weightRecord.deleteMany({});
    await db.breedingRecord.deleteMany({});
    await db.crop.deleteMany({});
    await db.animal.deleteMany({});
    await db.field.deleteMany({});
    await db.structure.deleteMany({});
    await db.product.deleteMany({});
    await db.customer.deleteMany({});
    await db.task.deleteMany({});
    await db.invitation.deleteMany({});
    await db.auditLog.deleteMany({});
    await db.user.deleteMany({});
  });

  // Tenant satiri RLS disidir; en son silinir.
  await prisma.tenant.delete({ where: { id: tenantId } });

  // Denetim kaydi SILMEDEN SONRA ve TENANT'SIZ yazilir: yukaridaki
  // `auditLog.deleteMany` bu tenant'in tum kayitlarini sildigi icin, tenant
  // baglaminda yazilan bir kayit ya silinirdi ya da olmayan bir tenant'a
  // baglanirdi. Hesap kapatma, LOGIN_FAILED gibi tenant'siz bir SISTEM olayidir.
  await logAudit(
    { id: session.user.id, name: session.user.name, email: session.user.email },
    "DELETE",
    "Tenant",
    tenantId,
    `çiftlik kalıcı olarak silindi (${tenant.name})`
  );

  return NextResponse.json({ ok: true });
}
