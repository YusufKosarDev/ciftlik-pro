import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { inventorySchema } from "@/lib/validations/inventory";

// POST /api/inventory -> yeni stok kalemi olusturur
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = inventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const item = await withTenant(authz.session.user.tenantId, (db) =>
      db.inventoryItem.create({
        data: {
          tenantId: authz.session.user.tenantId,
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          criticalLevel: data.criticalLevel,
          notes: data.notes || null,
        },
      })
    );

    await logAudit(authz.session.user, "CREATE", "InventoryItem", item.id, item.name);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Stok ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory -> toplu stok kalemi siler
export async function DELETE(request: Request) {
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Gecersiz kimlikler" }, { status: 400 });
    }

    const result = await withTenant(authz.session.user.tenantId, async (db) => {
      // Bu tenant altindaki gecerli stok kalemlerini bul
      const existing = await db.inventoryItem.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });

      if (existing.length === 0) return [];

      const foundIds = existing.map((i) => i.id);
      await db.inventoryItem.deleteMany({
        where: { id: { in: foundIds } },
      });

      return existing;
    });

    if (result.length > 0) {
      for (const item of result) {
        await logAudit(authz.session.user, "DELETE", "InventoryItem", item.id, item.name);
      }
    }

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    console.error("Toplu stok silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
