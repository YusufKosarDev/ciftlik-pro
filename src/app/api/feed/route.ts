import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { feedSchema } from "@/lib/validations/feed";

// Atomik stok dusumu sirasinda yetersiz stok durumunu isaretlemek icin
// kullanilan ozel hata. $transaction icinde firlatilirsa islem geri alinir.
class InsufficientStockError extends Error {}

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
    const tenantId = authz.session.user.tenantId;

    const item = await withTenant(tenantId, (db) =>
      db.inventoryItem.findFirst({ where: { id: data.inventoryItemId } })
    );
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

    // Stok dusumu, yaris kosulunu (TOCTOU) onlemek icin ATOMIK yapilir:
    // updateMany yalnizca quantity >= talep oldugunda gunceller. Iki eszamanli
    // istek olsa bile stok asla eksiye dusmez. count === 0 ise tx geri alinir.
    let log;
    try {
      log = await withTenant(tenantId, async (db) => {
        const updated = await db.inventoryItem.updateMany({
          where: { id: data.inventoryItemId, quantity: { gte: data.quantity } },
          data: { quantity: { decrement: data.quantity } },
        });
        if (updated.count === 0) {
          throw new InsufficientStockError();
        }
        return db.feedLog.create({
          data: {
            tenantId,
            inventoryItemId: data.inventoryItemId,
            date: new Date(data.date),
            quantity: data.quantity,
            notes: data.notes || null,
          },
        });
      });
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        // Esnek erisim sirasinda baska bir istek stogu tuketmis olabilir.
        const fresh = await withTenant(tenantId, (db) =>
          db.inventoryItem.findFirst({
            where: { id: data.inventoryItemId },
            select: { quantity: true, unit: true },
          })
        );
        return NextResponse.json(
          { error: `Yetersiz stok: mevcut ${fresh?.quantity ?? 0} ${fresh?.unit ?? item.unit}` },
          { status: 400 }
        );
      }
      throw err;
    }

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
