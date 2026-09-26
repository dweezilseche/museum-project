import Link from "next/link";

export const metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist.",
};

// Rendered for unknown URLs and for any notFound() call. Kept minimal and on
// brand — it sits inside the root layout, so the rail stays available.
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6 md:px-0">
      <p className="text-muted">404</p>
      <h1 className="text-3xl italic leading-tight md:text-4xl">
        This page could not be found
      </h1>
      <p className="text-muted">
        The work or page you are looking for may have moved or never existed.
      </p>
      <Link href="/" className="nav-link mt-2 underline underline-offset-4">
        Return to the collection
      </Link>
    </section>
  );
}
