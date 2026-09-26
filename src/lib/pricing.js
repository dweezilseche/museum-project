// Ticket catalogue for the museum. Prices are in euro cents (Stripe's unit).
// Pure data — safe to import from both client and server.
export const CURRENCY = "eur";

export const TICKET_TYPES = [
  {
    id: "adult",
    label: "Adult",
    description: "Full price",
    price: 1400,
  },
  {
    id: "reduced",
    label: "Reduced",
    description: "Students, seniors, groups",
    price: 900,
  },
  {
    id: "free",
    label: "Under 18",
    description: "Free — with a paying adult",
    price: 0,
  },
];

export const TICKET_TYPE_MAP = Object.fromEntries(
  TICKET_TYPES.map((type) => [type.id, type]),
);

export function formatPrice(cents) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format((cents ?? 0) / 100);
}
