import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { isDemoUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/billing/checkout -> ADMIN, tenant'ı PRO'ya yükseltir.
// Env-gated: Stripe + STRIPE_PRO_PRICE_ID varsa gerçek abonelik Checkout'u açar
// (plan webhook ile güncellenir). Yoksa (demo) planı doğrudan PRO yapar.
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: te("adminOnlyUpgradePlan") }, { status: 403 });
  }
  // Demo hesabi salt-okunurdur: vitrin ADMIN olsa da gercek plan degisikligi
  // (demo modunda dogrudan DB yazimi) yaptiramaz.
  if (isDemoUser(session.user.email)) {
    return NextResponse.json(
      { error: te("demoPlanLocked") },
      { status: 403 }
    );
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
    // Planı henüz değiştirmedik (bunu webhook yapar); yine de "kim, ne zaman
    // ödeme akışını başlattı" izi denetim kaydına girer.
    await logAudit(
      session.user,
      "UPDATE",
      "Tenant",
      tenantId,
      "PRO aboneliği için Stripe Checkout başlatıldı"
    );
    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  }

  // Demo modu (ödeme yapılandırılmamış): planı doğrudan yükselt.
  await prisma.tenant.update({ where: { id: tenantId }, data: { plan: "PRO" } });
  await logAudit(session.user, "UPDATE", "Tenant", tenantId, "plan: FREE → PRO");
  return NextResponse.json({ ok: true, upgraded: true });
}
