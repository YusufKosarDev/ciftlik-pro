import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// DELETE /api/feed/[id] -> deletes the consumption record and adds the deducted
// quantity back.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const log = await withTenant(authz.session.user.tenantId, async (db) => {
      const log = await db.feedLog.findFirst({ where: { id } });
      if (!log) return null;
      // Delete the record and restore the stock quantity, in one transaction.
      await db.feedLog.delete({ where: { id } });
      await db.inventoryItem.update({
        where: { id: log.inventoryItemId },
        data: { quantity: { increment: log.quantity } },
      });
      return log;
    });

    if (!log) {
      return NextResponse.json({ error: te("recordNotFound") }, { status: 404 });
    }
    await logAudit(authz.session.user, "DELETE", "FeedLog", id, `${log.quantity}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feed log:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
