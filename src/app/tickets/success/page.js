import { redirect } from "next/navigation";

import { fulfillCheckout } from "@/lib/tickets";
import { qrDataUrl } from "@/lib/qr";
import { formatPrice } from "@/lib/pricing";
import TicketStub from "@/components/TicketStub";
import RevealOnMount from "@/components/RevealOnMount";
import { TransitionLink } from "@/animation";

export const metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const MESSAGES = {
  "stripe-not-configured": "Ticketing isn't fully configured yet.",
  "not-found": "We couldn't find this booking.",
  unpaid: "Your payment hasn't been confirmed.",
  "fulfillment-failed": "Something went wrong while issuing your tickets.",
};

export default async function SuccessPage({ searchParams }) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/tickets");

  const result = await fulfillCheckout(sessionId);

  return (
    <RevealOnMount>
      <section className="mx-auto min-h-dvh max-w-xl px-6 pb-16 pt-8 md:px-0 md:pt-16">
        {result.error ? (
          <div className="flex flex-col items-start gap-4">
            <h1 className="text-3xl italic leading-tight md:text-4xl">
              Booking unavailable
            </h1>
            <p className="text-muted">
              {MESSAGES[result.error] ?? "Something went wrong."}
            </p>
            <TransitionLink
              href="/tickets"
              className="nav-link underline underline-offset-4"
            >
              Back to tickets
            </TransitionLink>
          </div>
        ) : (
          <SuccessBody order={result.order} />
        )}
      </section>
    </RevealOnMount>
  );
}

async function SuccessBody({ order }) {
  const withQr = await Promise.all(
    order.tickets.map(async (ticket) => ({
      ...ticket,
      qr: await qrDataUrl(ticket.reference),
    })),
  );

  return (
    <>
      <header className="mb-10">
        <h1 className="text-3xl italic leading-tight md:text-4xl">
          Your visit is booked
        </h1>
        <p className="mt-2 text-muted">
          {formatDate(order.visit_date)} · {order.reference} ·{" "}
          {formatPrice(order.amount_total)}
        </p>
        <p className="mt-4">
          We&apos;ve emailed your tickets to{" "}
          <span className="italic">{order.email}</span>.
        </p>
        {order.email_preview_url && (
          <p className="mt-2 text-muted">
            <a
              href={order.email_preview_url}
              target="_blank"
              rel="noreferrer"
              className="nav-link underline underline-offset-4"
            >
              View the email we sent (dev preview)
            </a>
          </p>
        )}
      </header>

      <div>
        {withQr.map((ticket) => (
          <TicketStub key={ticket.id} ticket={ticket} qr={ticket.qr} />
        ))}
      </div>

      <div className="mt-10 flex gap-8">
        <TransitionLink href="/" className="nav-link underline underline-offset-4">
          Back to the museum
        </TransitionLink>
        <TransitionLink
          href="/tickets/mine"
          className="nav-link underline underline-offset-4"
        >
          My tickets
        </TransitionLink>
      </div>
    </>
  );
}
