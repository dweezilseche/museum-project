import Overview from "@/components/Overview";

export const metadata = {
  title: "Overview",
  description:
    "Browse the full collection at a glance — every artist and work in the museum.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Overview · Museum",
    description:
      "Browse the full collection at a glance — every artist and work in the museum.",
    url: "/gallery",
  },
};

export default function GalleryPage() {
  return <Overview />;
}
