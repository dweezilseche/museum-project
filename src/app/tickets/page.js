import Tickets from "@/components/Tickets";

export const metadata = {
  title: "Tickets",
  description:
    "Book your visit — choose a date, ticket type and quantity, and receive your tickets by email.",
  alternates: { canonical: "/tickets" },
  openGraph: {
    title: "Tickets · Museum",
    description:
      "Book your visit — choose a date, ticket type and quantity, and receive your tickets by email.",
    url: "/tickets",
  },
};

export default function TicketsPage() {
  const today = new Date().toISOString().slice(0, 10);
  return <Tickets today={today} />;
}
