import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { resolveStorefront } from "@/lib/storefront";
import { orderSchema } from "@/lib/validations/order";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/orders -> a PUBLIC per-tenant storefront order (multi-line, unpaid).
// It needs no identity; a rate limit, validation and an active-product check are
// applied. The order is attached to the tenant resolved from the slug, and price
// and name are snapshotted per line.
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const rl = await rateLimit(`order:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: te("rateLimited") },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Slug -> tenant. An invalid slug means an unknown storefront.
    const tenant = await resolveStorefront(data.slug);
    if (!tenant) {
      return NextResponse.json({ error: te("storeNotFound") }, { status: 404 });
    }

    // Everything runs in this tenant's context: product validation and order
    // creation alike.
    const result = await withTenant(tenant.id, async (db) => {
      const productIds = [...new Set(data.items.map((i) => i.productId))];
      // forTenant injects the tenantId filter, so another tenant's product cannot
      // come back.
      const products = await db.product.findMany({
        where: { id: { in: productIds }, active: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      if (data.items.some((i) => !byId.has(i.productId))) {
        return { error: te("cartHasUnavailableProduct") } as const;
      }

      const itemsData = data.items.map((i) => {
        const p = byId.get(i.productId)!;
        return {
          tenantId: tenant.id,
          productId: p.id,
          productName: p.name,
          unitPrice: p.price,
          quantity: i.quantity,
          lineTotal: p.price * i.quantity,
        };
      });
      const total = itemsData.reduce((sum, it) => sum + it.lineTotal, 0);

      const order = await db.order.create({
        data: {
          tenantId: tenant.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone || null,
          note: data.note || null,
          total,
          status: "PENDING",
          items: { create: itemsData },
        },
      });
      return { order, itemsData, total } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const { order, itemsData, total } = result;

    // Audit record: the order arrives through the public flow with no session, so
    // the actor's identity is the customer's name. The row is written in the
    // context of the tenant the order belongs to, so the farm sees it in its own
    // audit log.
    await logAudit(
      { tenantId: tenant.id, name: data.customerName },
      "CREATE",
      "Order",
      order.id,
      `${itemsData.length} kalem, toplam ${total} (magaza siparisi)`
    );

    // When real payment is configured, create a Stripe Checkout session and return
    // its URL. To support fractional quantities each line uses quantity:1 with
    // unit_amount=lineTotal.
    const stripe = getStripe();
    if (stripe) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: itemsData.map((it) => ({
          price_data: {
            currency: "try",
            product_data: { name: `${it.productName} (${it.quantity})` },
            unit_amount: Math.round(it.lineTotal * 100),
          },
          quantity: 1,
        })),
        // tenantId lets the webhook update the order in the right tenant context.
        metadata: { orderId: order.id, tenantId: tenant.id },
        success_url: `${origin}/magaza/${tenant.slug}/siparis-tamam`,
        cancel_url: `${origin}/magaza/${tenant.slug}/sepet`,
      });
      await withTenant(tenant.id, (db) =>
        db.order.update({ where: { id: order.id }, data: { paymentRef: checkout.id } })
      );
      return NextResponse.json(
        { ok: true, orderId: order.id, checkoutUrl: checkout.url },
        { status: 201 }
      );
    }

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
