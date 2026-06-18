import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenant-prisma";

// POST /api/stripe/webhook -> Stripe odeme bildirimleri. Imza STRIPE_WEBHOOK_SECRET
// ile dogrulanir. checkout.session.completed gelince ilgili siparis PAID + CONFIRMED
// olarak isaretlenir. Ham govde imza dogrulamasi icin text() ile okunur.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Odeme yapilandirilmamis" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Imza yok" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.error("Stripe webhook imza dogrulamasi basarisiz:", err);
    return NextResponse.json({ error: "Gecersiz imza" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenantId = session.metadata?.tenantId;

    if (session.mode === "subscription" && tenantId) {
      // Abonelik basladi -> tenant PRO. Tenant RLS disidir.
      await prisma.tenant.update({ where: { id: tenantId }, data: { plan: "PRO" } });
    } else {
      // Magaza siparisi odemesi.
      const orderId = session.metadata?.orderId;
      if (orderId && tenantId) {
        // Order RLS'e tabidir: siparis, olusturulurken metadata'ya yazilan tenant
        // baglaminda guncellenir. updateMany idempotenttir (bulunmazsa hata yok).
        await withTenant(tenantId, (db) =>
          db.order.updateMany({
            where: { id: orderId },
            data: { paymentStatus: "PAID", status: "CONFIRMED" },
          })
        );
      }
    }
  }

  // Abonelik iptal/sona erdi -> tenant FREE'ye doner.
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const tenantId = sub.metadata?.tenantId;
    if (tenantId) {
      await prisma.tenant.update({ where: { id: tenantId }, data: { plan: "FREE" } });
    }
  }

  return NextResponse.json({ received: true });
}
