import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/billing/checkout -> ADMIN, tenant'ı PRO'ya yükseltir.
// Env-gated: Stripe + STRIPE_PRO_PRICE_ID varsa gerçek abonelik Checkout'u açar
// (plan webhook ile güncellenir). Yoksa (demo) planı doğrudan PRO yapar.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yalnızca yönetici planı yükseltebilir" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (stripe && priceId) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // Webhook'ta planı doğru tenant'a yazmak için.
      metadata: { tenantId, kind: "subscription" },
      subscription_data: { metadata: { tenantId } },
      success_url: `${origin}/panel/abonelik?ok=1`,
      cancel_url: `${origin}/panel/abonelik`,
    });
    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  }

  // Demo modu (ödeme yapılandırılmamış): planı doğrudan yükselt.
  await prisma.tenant.update({ where: { id: tenantId }, data: { plan: "PRO" } });
  return NextResponse.json({ ok: true, upgraded: true });
}
