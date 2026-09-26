"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { useMuseum } from "@/components/MuseumProvider";
import TicketStub from "@/components/TicketStub";
import { usePageTransition, TransitionLink } from "@/animation";
import { fetchMyOrders } from "@/app/actions/tickets";
import { formatPrice } from "@/lib/pricing";

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

export default function MyTickets() {
  const { status } = useSession();
  const { setAuthOpen } = useMuseum();
  const transition = usePageTransition();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    transition?.reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetchMyOrders().then((list) => {
      if (!cancelled) setOrders(list);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <section className="mx-auto min-h-dvh max-w-xl px-6 pb-16 pt-8 md:px-0 md:pt-16">
      <h1 className="mb-10 text-3xl italic leading-tight md:text-4xl">
        My tickets
      </h1>

      {status === "loading" ? (
        <p className="text-muted">…</p>
      ) : status !== "authenticated" ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">Sign in to find the tickets you booked.</p>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="nav-link underline underline-offset-4"
          >
            Sign in
          </button>
        </div>
      ) : orders === null ? (
        <p className="text-muted">…</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">You haven&apos;t booked any tickets yet.</p>
          <TransitionLink
            href="/tickets"
            className="nav-link underline underline-offset-4"
          >
            Book a visit
          </TransitionLink>
        </div>
      ) : (
        <div className="flex flex-col gap-14">
          {orders.map((order) => (
            <article key={order.id}>
              <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="italic">{formatDate(order.visit_date)}</span>
                <span className="text-muted tabular-nums">
                  {order.reference} · {formatPrice(order.amount_total)}
                </span>
              </header>

              <div className="mt-4">
                {order.tickets.map((ticket) => (
                  <TicketStub key={ticket.id} ticket={ticket} qr={ticket.qr} />
                ))}
              </div>

              {order.email_preview_url && (
                <p className="mt-4 text-muted">
                  <a
                    href={order.email_preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="nav-link underline underline-offset-4"
                  >
                    View the confirmation email (dev preview)
                  </a>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
