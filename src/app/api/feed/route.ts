import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { feedSchema } from "@/lib/validations/feed";

// POST /api/feed -> yem tuketim kaydi olusturur ve stok miktarini dusurur.
// Kayit olusturma + stok dusumu tek transaction'da yapilir.
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = feedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const item = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });
    if (!item) {
      return NextResponse.json({ error: "Yem kalemi bulunamadi" }, { status: 404 });
    }
    if (item.category !== "FEED") {
      return NextResponse.json(
        { error: "Yalnizca yem (FEED) kalemleri tuketilebilir" },
        { status: 400 }
      );
    }
    if (data.quantity > item.quantity) {
      return NextResponse.json(
        { error: `Yetersiz stok: mevcut ${item.quantity} ${item.unit}` },
        { status: 400 }
      );
    }

    const [log] = await prisma.$transaction([
      prisma.feedLog.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          date: new Date(data.date),
          quantity: data.quantity,
          notes: data.notes || null,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: { quantity: { decrement: data.quantity } },
      }),
    ]);

    await logAudit(authz.session.user, "CREATE", "FeedLog", log.id, `${item.name}: ${data.quantity} ${item.unit}`);

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Yem tuketim hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
