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
