"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { listOrdersByUser } from "@/lib/db";
import { qrDataUrl } from "@/lib/qr";
import { validateOrder, buildLineItems } from "@/lib/tickets";

// Create a Stripe Checkout session and hand the redirect URL back to the client.
export async function startCheckout({ visitDate, quantities }) {
  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        "Ticketing isn't configured yet — a Stripe secret key is required in .env.",
    };
  }

  const check = validateOrder({ visitDate, quantities });
  if (check.error) return { error: check.error };

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const email = session?.user?.email || null;

  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") || "http";
  const host = headerList.get("host");
  const origin = `${proto}://${host}`;

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: buildLineItems(check.quantities),
      ...(email ? { customer_email: email } : {}),
      success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tickets/cancel`,
      metadata: {
        visit_date: check.visitDate,
        quantities: JSON.stringify(check.quantities),
        user_id: userId != null ? String(userId) : "",
      },
    });
    return { url: checkout.url };
  } catch {
    return { error: "Could not start the payment. Please try again." };
  }
}

// The authenticated user's orders, each ticket carrying a ready-to-render QR.
export async function fetchMyOrders() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return [];

  const orders = listOrdersByUser(Number(id));
  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      tickets: await Promise.all(
        order.tickets.map(async (ticket) => ({
          ...ticket,
          qr: await qrDataUrl(ticket.reference),
        })),
      ),
    })),
  );
}
