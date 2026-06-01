import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { inventorySchema } from "@/lib/validations/inventory";

// PUT /api/inventory/[id] -> stok kalemini gunceller
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = inventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kalem bulunamadi" }, { status: 404 });
    }

    const data = parsed.data;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        criticalLevel: data.criticalLevel,
        notes: data.notes || null,
      },
    });

    await logAudit(authz.session.user, "UPDATE", "InventoryItem", item.id, item.name);

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Stok guncelleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] -> stok kalemini siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kalem bulunamadi" }, { status: 404 });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    await logAudit(authz.session.user, "DELETE", "InventoryItem", id, existing.name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stok silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
