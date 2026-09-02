import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";
import { logAudit } from "@/lib/audit";

// There is no session in a webhook; the audit record's actor is the automation.
const STRIPE_ACTOR = "Stripe (webhook)";

// POST /api/stripe/webhook -> Stripe payment notifications. The signature is
// verified against STRIPE_WEBHOOK_SECRET. On checkout.session.completed the
// matching order is marked PAID + CONFIRMED. The raw body is read with text(),
// because signature verification needs it unparsed.
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: te("paymentsNotConfigured") }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: te("signatureMissing") }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: te("invalidSignature") }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenantId = session.metadata?.tenantId;

    if (session.mode === "subscription" && tenantId) {
      // A subscription started -> the tenant goes PRO. Tenant is outside RLS.
      await prisma.tenant.update({ where: { id: tenantId }, data: { plan: "PRO" } });
      await logAudit(
        { tenantId, name: STRIPE_ACTOR },
        "UPDATE",
        "Tenant",
        tenantId,
        "abonelik basladi — plan: PRO"
      );
    } else {
      // A storefront order payment.
      const orderId = session.metadata?.orderId;
      if (orderId && tenantId) {
        // Order is subject to RLS: it is updated in the tenant context written
        // into the metadata when the order was created. updateMany is idempotent —
        // no error if nothing matches.
        const updated = await withTenant(tenantId, (db) =>
          db.order.updateMany({
            where: { id: orderId },
            data: { paymentStatus: "PAID", status: "CONFIRMED" },
          })
        );
        // count === 0: the order was not found in this tenant context (wrong or
        // stale metadata). With no update there is no audit record either.
        if (updated.count > 0) {
          await logAudit(
            { tenantId, name: STRIPE_ACTOR },
            "UPDATE",
            "Order",
            orderId,
            "odeme alindi — PAID / CONFIRMED"
          );
        }
      }
    }
  }

  // The subscription was cancelled or expired -> the tenant returns to FREE.
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const tenantId = sub.metadata?.tenantId;
    if (tenantId) {
      await prisma.tenant.update({ where: { id: tenantId }, data: { plan: "FREE" } });
      await logAudit(
        { tenantId, name: STRIPE_ACTOR },
        "UPDATE",
        "Tenant",
        tenantId,
        "abonelik sona erdi — plan: FREE"
      );
    }
  }

  return NextResponse.json({ received: true });
}
