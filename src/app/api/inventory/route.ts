import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit, logAuditMany } from "@/lib/audit";
import { inventorySchema } from "@/lib/validations/inventory";

// POST /api/inventory -> creates an inventory item
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = inventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
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
    console.error("Failed to add inventory item:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory -> bulk-deletes inventory items
export async function DELETE(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: te("invalidIds") }, { status: 400 });
    }

    const result = await withTenant(authz.session.user.tenantId, async (db) => {
      // Find the valid inventory items belonging to this tenant
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

    // One createMany (see logAuditMany in audit.ts): a single write instead of one
    // INSERT per record during a bulk delete.
    await logAuditMany(
      authz.session.user,
      "DELETE",
      "InventoryItem",
      result.map((item) => ({ entityId: item.id, summary: item.name }))
    );

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    console.error("Bulk inventory delete failed:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
