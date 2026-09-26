import Stripe from "stripe";

// Lazily created Stripe client. Returns null when no key is configured so the
// UI can degrade gracefully (the checkout button explains what's missing)
// rather than crashing the whole route.
let client = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
