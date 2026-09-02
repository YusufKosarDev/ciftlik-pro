import Stripe from "stripe";

// Real payment is env-gated: with STRIPE_SECRET_KEY set the storefront uses Stripe
// Checkout, without it it carries on in the pay-on-delivery flow.
let client: Stripe | null = null;

export function isPaymentEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}
