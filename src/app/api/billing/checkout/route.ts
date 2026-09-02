import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { isDemoUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

// POST /api/billing/checkout -> an ADMIN upgrades the tenant to PRO.
// Env-gated: with Stripe and STRIPE_PRO_PRICE_ID present it opens a real
// subscription Checkout (the plan is then updated by the webhook). Without them
// (demo mode) it sets the plan to PRO directly.
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: te("adminOnlyUpgradePlan") }, { status: 403 });
  }
  // The demo account is read-only: even the showcase ADMIN cannot make a real plan
  // change (which in demo mode would be a direct database write).
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
      // So the webhook can write the plan to the right tenant.
      metadata: { tenantId, kind: "subscription" },
      subscription_data: { metadata: { tenantId } },
      success_url: `${origin}/panel/abonelik?ok=1`,
      cancel_url: `${origin}/panel/abonelik`,
    });
    // The plan is not changed yet — the webhook does that — but who started the
    // payment flow, and when, still goes into the audit log.
    await logAudit(
      session.user,
      "UPDATE",
      "Tenant",
      tenantId,
      "PRO aboneliği için Stripe Checkout başlatıldı"
    );
    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  }

  // Demo mode (no payment configured): upgrade the plan directly.
  await prisma.tenant.update({ where: { id: tenantId }, data: { plan: "PRO" } });
  await logAudit(session.user, "UPDATE", "Tenant", tenantId, "plan: FREE → PRO");
  return NextResponse.json({ ok: true, upgraded: true });
}
