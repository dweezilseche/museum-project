import RevealOnMount from "@/components/RevealOnMount";
import { TransitionLink } from "@/animation";

export const metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <RevealOnMount>
      <section className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6 md:px-0">
        <h1 className="text-3xl italic leading-tight md:text-4xl">
          Payment cancelled
        </h1>
        <p className="text-muted">
          No charge was made. You can pick up where you left off whenever
          you&apos;re ready.
        </p>
        <TransitionLink
          href="/tickets"
          className="nav-link underline underline-offset-4"
        >
          Back to tickets
        </TransitionLink>
      </section>
    </RevealOnMount>
  );
}
