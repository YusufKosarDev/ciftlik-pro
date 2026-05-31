import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";

// DELETE /api/feed/[id] -> tuketim kaydini siler ve dusurulen miktari geri ekler.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const log = await prisma.feedLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
    }

    // Kaydi sil + stok miktarini geri ekle (tek transaction).
    await prisma.$transaction([
      prisma.feedLog.delete({ where: { id } }),
      prisma.inventoryItem.update({
        where: { id: log.inventoryItemId },
        data: { quantity: { increment: log.quantity } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Yem kaydi silme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
