import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { resolveStorefront } from "@/lib/storefront";
import { orderSchema } from "@/lib/validations/order";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";

// POST /api/orders -> HERKESE ACIK per-tenant magaza siparisi (cok kalemli, odemesiz).
// Kimlik gerektirmez; hiz siniri + dogrulama + urun aktiflik kontrolu uygulanir.
// Siparis, slug ile cozumlenen tenant'a baglanir; fiyat/ad her kalem icin snapshot.
export async function POST(request: Request) {
  try {
    const rl = rateLimit(`order:${clientIp(request)}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen biraz sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Slug -> tenant. Gecersiz slug = bilinmeyen magaza.
    const tenant = await resolveStorefront(data.slug);
    if (!tenant) {
      return NextResponse.json({ error: "Magaza bulunamadi" }, { status: 404 });
    }

    // Tum islemler bu tenant baglaminda: urun dogrulamasi + siparis olusturma.
    const result = await withTenant(tenant.id, async (db) => {
      const productIds = [...new Set(data.items.map((i) => i.productId))];
      // forTenant, sorguya tenantId filtresi enjekte eder: baska tenant'in urunu gelmez.
      const products = await db.product.findMany({
        where: { id: { in: productIds }, active: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      if (data.items.some((i) => !byId.has(i.productId))) {
        return { error: "Sepette satista olmayan bir urun var" } as const;
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
    const { order, itemsData } = result;

    // Gercek odeme yapilandirildiysa Stripe Checkout oturumu olustur ve URL dondur.
    // Kesirli miktari desteklemek icin her satir quantity:1 + unit_amount=lineTotal.
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
        // tenantId webhook'ta siparisi dogru tenant baglaminda guncellemek icin.
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
    console.error("Siparis olusturma hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
