import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { feedSchema } from "@/lib/validations/feed";

// A dedicated error used to signal insufficient stock during the atomic
// deduction. Thrown inside $transaction, it rolls the operation back.
class InsufficientStockError extends Error {}

// POST /api/feed -> records feed consumption and deducts the stock quantity.
// Creating the record and deducting the stock happen in one transaction.
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("inventory");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = feedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const tenantId = authz.session.user.tenantId;

    const item = await withTenant(tenantId, (db) =>
      db.inventoryItem.findFirst({ where: { id: data.inventoryItemId } })
    );
    if (!item) {
      return NextResponse.json({ error: te("feedItemNotFound") }, { status: 404 });
    }
    if (item.category !== "FEED") {
      return NextResponse.json(
        { error: te("onlyFeedItems") },
        { status: 400 }
      );
    }
    if (data.quantity > item.quantity) {
      return NextResponse.json(
        { error: te("insufficientStock", { quantity: item.quantity, unit: item.unit }) },
        { status: 400 }
      );
    }

    // The deduction is ATOMIC, to close the TOCTOU race: updateMany only updates
    // when quantity >= the amount requested. Even with two concurrent requests the
    // stock can never go negative. When count === 0 the transaction is rolled
    // back.
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
        // Another request may have consumed the stock in the meantime.
        const fresh = await withTenant(tenantId, (db) =>
          db.inventoryItem.findFirst({
            where: { id: data.inventoryItemId },
            select: { quantity: true, unit: true },
          })
        );
        return NextResponse.json(
          { error: te("insufficientStock", { quantity: fresh?.quantity ?? 0, unit: fresh?.unit ?? item.unit }) },
          { status: 400 }
        );
      }
      throw err;
    }

    await logAudit(authz.session.user, "CREATE", "FeedLog", log.id, `${item.name}: ${data.quantity} ${item.unit}`);

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Feed consumption failed:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
