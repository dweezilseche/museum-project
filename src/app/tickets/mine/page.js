import MyTickets from "@/components/MyTickets";

export const metadata = {
  title: "My tickets",
  description: "The tickets you have purchased.",
  robots: { index: false, follow: false },
};

export default function MyTicketsPage() {
  return <MyTickets />;
}
