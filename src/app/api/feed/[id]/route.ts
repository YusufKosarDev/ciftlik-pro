import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// DELETE /api/feed/[id] -> tuketim kaydini siler ve dusurulen miktari geri ekler.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const log = await withTenant(authz.session.user.tenantId, async (db) => {
      const log = await db.feedLog.findFirst({ where: { id } });
      if (!log) return null;
      // Kaydi sil + stok miktarini geri ekle (tek transaction).
      await db.feedLog.delete({ where: { id } });
      await db.inventoryItem.update({
        where: { id: log.inventoryItemId },
        data: { quantity: { increment: log.quantity } },
      });
      return log;
    });

    if (!log) {
      return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "FeedLog", id, `${log.quantity}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Yem kaydi silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
