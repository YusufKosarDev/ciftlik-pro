import Stripe from "stripe";

// Gerçek ödeme env-gated'dir: STRIPE_SECRET_KEY tanimliysa Stripe Checkout
// kullanilir, yoksa magaza "odeme teslimatta" akisinda calismaya devam eder.
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
