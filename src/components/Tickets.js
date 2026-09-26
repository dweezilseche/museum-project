"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { usePageTransition, TransitionLink } from "@/animation";
import { startCheckout } from "@/app/actions/tickets";
import { TICKET_TYPES, formatPrice } from "@/lib/pricing";

export default function Tickets({ today }) {
  const { status } = useSession();
  const transition = usePageTransition();

  const [visitDate, setVisitDate] = useState(today);
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(TICKET_TYPES.map((type) => [type.id, 0])),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    transition?.reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(
    () =>
      TICKET_TYPES.reduce(
        (sum, type) => sum + type.price * (quantities[type.id] || 0),
        0,
      ),
    [quantities],
  );
  const count = useMemo(
    () => Object.values(quantities).reduce((sum, n) => sum + n, 0),
    [quantities],
  );

  const setQty = (id, next) =>
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(20, next)),
    }));

  const checkout = async () => {
    setError(null);
    setPending(true);
    try {
      const result = await startCheckout({ visitDate, quantities });
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      setError(result?.error ?? "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mx-auto min-h-dvh max-w-xl px-6 pb-16 pt-8 md:px-0 md:pt-16">
      <header className="mb-10">
        <h1 className="text-3xl italic leading-tight md:text-4xl">
          Plan your visit
        </h1>
        <p className="mt-2 text-muted">
          Book your admission below. Your tickets are sent by email
          {status === "authenticated"
            ? " and saved to your account."
            : "; sign in to also save them to an account."}
        </p>
      </header>

      {/* Visit date */}
      <label className="flex items-center justify-between gap-6 border-t border-foreground/10 py-5">
        <span>Date of visit</span>
        <input
          type="date"
          value={visitDate}
          min={today}
          onChange={(event) => setVisitDate(event.target.value)}
          className="border-0 border-b border-foreground/20 bg-transparent pb-1 outline-none focus:border-foreground"
        />
      </label>

      {/* Ticket types */}
      {TICKET_TYPES.map((type) => (
        <div
          key={type.id}
          className="flex items-center justify-between gap-6 border-t border-foreground/10 py-5"
        >
          <div className="min-w-0">
            <p>
              {type.label}
              <span className="text-muted">
                {" "}
                — {type.price === 0 ? "Free" : formatPrice(type.price)}
              </span>
            </p>
            <p className="text-muted">{type.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={`Remove one ${type.label} ticket`}
              onClick={() => setQty(type.id, (quantities[type.id] || 0) - 1)}
              className="nav-link text-lg leading-none disabled:opacity-30"
              disabled={(quantities[type.id] || 0) === 0}
            >
              −
            </button>
            <span className="w-5 text-center tabular-nums">
              {quantities[type.id] || 0}
            </span>
            <button
              type="button"
              aria-label={`Add one ${type.label} ticket`}
              onClick={() => setQty(type.id, (quantities[type.id] || 0) + 1)}
              className="nav-link text-lg leading-none"
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* Total + checkout */}
      <div className="mt-8 flex items-center justify-between border-t border-foreground/30 pt-6">
        <span className="text-muted tabular-nums">
          {count} {count === 1 ? "ticket" : "tickets"}
        </span>
        <span className="text-lg tabular-nums">{formatPrice(total)}</span>
      </div>

      {error && <p className="mt-4 text-muted">{error}</p>}

      <button
        type="button"
        onClick={checkout}
        disabled={pending || count === 0}
        className="nav-link mt-6 underline underline-offset-4 disabled:no-underline disabled:opacity-40"
      >
        {pending ? "Redirecting to payment…" : "Proceed to payment"}
      </button>

      {status === "authenticated" && (
        <p className="mt-8 text-muted">
          <TransitionLink
            href="/tickets/mine"
            className="nav-link underline underline-offset-4"
          >
            View my tickets
          </TransitionLink>
        </p>
      )}
    </section>
  );
}
