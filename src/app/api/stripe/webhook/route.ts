import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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
    const orderId = session.metadata?.orderId;
    if (orderId) {
      // updateMany: siparis bulunamazsa hata firlatmaz (idempotent).
      await prisma.order.updateMany({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
