import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";
import { logAudit } from "@/lib/audit";

// DELETE /api/tenant -> an ADMIN permanently deletes their own tenant and ALL of
// its data (account closure / the GDPR-KVKK right to erasure). Confirmation: the
// body's `confirm` must equal the farm's name exactly. The demo farm
// (default-tenant) is protected.
export async function DELETE(request: Request) {
  const te = await getTranslations("Errors");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: te("adminOnlyDeleteFarm") }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  // The default tenant cannot be deleted, to protect the showcase demo data.
  if (tenantId === "default-tenant") {
    return NextResponse.json(
      { error: te("demoFarmProtected") },
      { status: 403 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: te("tenantNotFound") }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.confirm !== tenant.name) {
    return NextResponse.json(
      { error: te("confirmMismatch") },
      { status: 400 }
    );
  }

  // Delete all of the tenant's data in FK-safe order (children before parents).
  // Every deleteMany is scoped by tenantId through forTenant, and RLS bounds it
  // again at the database level.
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

  // The Tenant row is outside RLS; it goes last.
  await prisma.tenant.delete({ where: { id: tenantId } });

  // The audit record is written AFTER the wipe and WITHOUT a tenant: the
  // `auditLog.deleteMany` above removes all of this tenant's rows, so a record
  // written in the tenant context would either be deleted with them or point at a
  // tenant that no longer exists. Account closure is a SYSTEM event with no
  // tenant, like LOGIN_FAILED.
  await logAudit(
    { id: session.user.id, name: session.user.name, email: session.user.email },
    "DELETE",
    "Tenant",
    tenantId,
    `çiftlik kalıcı olarak silindi (${tenant.name})`
  );

  return NextResponse.json({ ok: true });
}
