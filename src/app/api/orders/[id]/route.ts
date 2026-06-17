import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
});

// PATCH /api/orders/[id] -> siparis durumunu gunceller (ADMIN/ACCOUNTANT)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("orders");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Gecersiz durum" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    await logAudit(
      authz.session.user,
      "UPDATE",
      "Order",
      order.id,
      `${order.customerName} -> ${order.status}`
    );

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Siparis guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] -> siparisi siler (ADMIN/ACCOUNTANT)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("orders");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    await prisma.order.delete({ where: { id } });
    await logAudit(authz.session.user, "DELETE", "Order", id, existing.customerName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Siparis silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
