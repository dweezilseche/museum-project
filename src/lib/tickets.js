import { randomUUID } from "node:crypto";

import { getStripe } from "@/lib/stripe";
import { TICKET_TYPES, CURRENCY } from "@/lib/pricing";
import {
  createPaidOrder,
  getOrderByStripeSession,
  setOrderEmailPreview,
} from "@/lib/db";
import { sendTicketsEmail } from "@/lib/email";

const code = () => randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

export function makeOrderReference() {
  return `MUS-${code()}`;
}

// Clamp/normalise the requested quantities and compute counts + payable amount.
export function normalizeQuantities(input) {
  const quantities = {};
  let totalCount = 0;
  let payableAmount = 0;
  for (const type of TICKET_TYPES) {
    const n = Math.max(0, Math.min(20, Math.floor(Number(input?.[type.id]) || 0)));
    quantities[type.id] = n;
    totalCount += n;
    payableAmount += n * type.price;
  }
  return { quantities, totalCount, payableAmount };
}

export function validateOrder({ visitDate, quantities }) {
  if (!visitDate || !/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    return { error: "Please choose a valid visit date." };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chosen = new Date(`${visitDate}T00:00:00`);
  if (Number.isNaN(chosen.getTime()) || chosen < today) {
    return { error: "The visit date must be today or later." };
  }

  const norm = normalizeQuantities(quantities);
  if (norm.totalCount === 0) {
    return { error: "Please add at least one ticket." };
  }
  if (norm.payableAmount === 0) {
    return {
      error: "Under-18 tickets require at least one paying adult or reduced ticket.",
    };
  }
  return { ...norm, visitDate };
}

export function buildLineItems(quantities) {
  const items = [];
  for (const type of TICKET_TYPES) {
    const n = quantities[type.id] || 0;
    if (n <= 0) continue;
    items.push({
      quantity: n,
      price_data: {
        currency: CURRENCY,
        unit_amount: type.price,
        product_data: { name: `Museum admission — ${type.label}` },
      },
    });
  }
  return items;
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Verify a completed Stripe Checkout session, then create the order + tickets
// and send the email — exactly once per session (idempotent on the session id).
export async function fulfillCheckout(sessionId) {
  const stripe = getStripe();
  if (!stripe) return { error: "stripe-not-configured" };

  const existing = getOrderByStripeSession(sessionId);
  if (existing) return { order: existing };

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { error: "not-found" };
  }
  if (session.payment_status !== "paid") return { error: "unpaid" };

  const meta = session.metadata || {};
  const quantities = safeParse(meta.quantities) || {};
  const visitDate = meta.visit_date;
  const userId = meta.user_id ? Number(meta.user_id) : null;
  const email =
    session.customer_details?.email || session.customer_email || meta.email;

  const reference = makeOrderReference();
  const tickets = [];
  let index = 0;
  for (const type of TICKET_TYPES) {
    const n = quantities[type.id] || 0;
    for (let k = 0; k < n; k += 1) {
      index += 1;
      tickets.push({
        reference: `${reference}-${String(index).padStart(2, "0")}`,
        category: type.id,
      });
    }
  }

  let order;
  try {
    order = createPaidOrder({
      reference,
      stripeSessionId: sessionId,
      userId,
      email,
      visitDate,
      amountTotal: session.amount_total,
      currency: session.currency || "eur",
      tickets,
    });
  } catch {
    // A concurrent request may have fulfilled it first.
    const again = getOrderByStripeSession(sessionId);
    if (again) return { order: again };
    return { error: "fulfillment-failed" };
  }

  try {
    const preview = await sendTicketsEmail(order);
    if (preview) {
      setOrderEmailPreview(order.id, preview);
      order.email_preview_url = preview;
    }
  } catch {
    // A failed email must not lose a paid order.
  }

  return { order };
}
