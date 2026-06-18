import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";

// GET /api/tenant/export -> ADMIN, tenant'inin TUM verisini JSON olarak indirir
// (KVKK/GDPR tasinabilirlik). Parolalar disarida birakilir.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yalnizca yonetici dışa aktarabilir" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, slug: true, plan: true, createdAt: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant bulunamadi" }, { status: 404 });
  }

  const data = await withTenant(tenantId, async (db) => {
    const [
      users,
      animals,
      fields,
      inventory,
      transactions,
      tasks,
      structures,
      customers,
      sales,
      products,
      orders,
      invitations,
      auditLog,
    ] = await Promise.all([
      // Parola hash'i KASTEN haric.
      db.user.findMany({
        select: { id: true, name: true, email: true, role: true, onboardedAt: true, createdAt: true },
      }),
      db.animal.findMany({
        include: {
          healthRecords: true,
          vaccinations: true,
          milkYields: true,
          weightRecords: true,
          breedingRecords: true,
        },
      }),
      db.field.findMany({ include: { crops: true } }),
      db.inventoryItem.findMany({ include: { feedLogs: true } }),
      db.transaction.findMany(),
      db.task.findMany(),
      db.structure.findMany(),
      db.customer.findMany(),
      db.sale.findMany(),
      db.product.findMany(),
      db.order.findMany({ include: { items: true } }),
      db.invitation.findMany({ select: { id: true, email: true, role: true, expiresAt: true, acceptedAt: true, createdAt: true } }),
      db.auditLog.findMany(),
    ]);
    return {
      users,
      animals,
      fields,
      inventory,
      transactions,
      tasks,
      structures,
      customers,
      sales,
      products,
      orders,
      invitations,
      auditLog,
    };
  });

  const payload = { exportedAt: new Date().toISOString(), tenant, data };
  const filename = `${tenant.slug}-disa-aktarim-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
