import { TICKET_TYPE_MAP } from "@/lib/pricing";

// One ticket: category, unique reference and its QR. Plain presentational
// component (no client/server directive) so it renders in both a Server
// Component page and a Client Component list. `qr` is a data URL.
export default function TicketStub({ ticket, qr }) {
  const type = TICKET_TYPE_MAP[ticket.category];

  return (
    <div className="flex items-center justify-between gap-6 border-t border-foreground/10 py-5">
      <div className="min-w-0">
        <p className="italic">{type?.label ?? ticket.category}</p>
        <p className="text-muted">{ticket.reference}</p>
      </div>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qr}
          alt={`QR code ${ticket.reference}`}
          width={84}
          height={84}
          className="shrink-0"
        />
      ) : null}
    </div>
  );
}
