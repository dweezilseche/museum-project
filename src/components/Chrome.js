"use client";

import { useEffect, useState } from "react";

import { useMuseum } from "@/components/MuseumProvider";
import Rail from "@/components/Rail";
import AuthDialog from "@/components/AuthDialog";
import ArtworkDetail from "@/components/ArtworkDetail";
import { PageTransition, Preloader } from "@/animation";

/* -------------------------------------------------------------------------- */
/* Information dialog (project content)                                       */
/* -------------------------------------------------------------------------- */

function InfoDialog() {
  const { artists, infoOpen, setInfoOpen } = useMuseum();
  const [copied, setCopied] = useState(false);

  const movements = [
    ...new Set(
      artists
        .flatMap((artist) => artist.works.map((work) => work.movement))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  const email = "studio@museum.art";

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!infoOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Information"
      className="animate-fade-in fixed inset-0 z-[70] overflow-y-auto bg-background px-6 py-8 md:px-16 md:py-14"
    >
      <button
        type="button"
        onClick={() => setInfoOpen(false)}
        className="nav-link fixed right-6 top-8 z-10 md:right-16 md:top-14"
      >
        Close
      </button>

      <div className="mx-auto max-w-3xl">
        <h2 className="max-w-2xl text-3xl leading-[1.15] md:text-5xl">
          A collection of major works, presented artist by artist.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
          <section>
            <h3 className="mb-4 text-muted">Movements</h3>
            <p className="leading-relaxed">{movements.join(", ")}.</p>
          </section>

          <section>
            <h3 className="mb-4 text-muted">About</h3>
            <p className="leading-relaxed">
              {artists.length} artists, from the Renaissance to the twentieth
              century. Each artist opens a room: scroll through their works, or
              switch to the overview to take everything in at a glance.
            </p>
          </section>

          <section>
            <h3 className="mb-4 text-muted">Contact</h3>
            <button type="button" onClick={copyEmail} className="nav-link">
              {copied ? "Copied" : email}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chrome — assembles the reusable animation shells around the app            */
/* -------------------------------------------------------------------------- */

export default function Chrome({ children }) {
  const { setInfoOpen, setIntroDone } = useMuseum();

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setInfoOpen]);

  return (
    <>
      <Preloader
        label="Museum"
        sessionKey="museum-intro"
        onReveal={() => setIntroDone(true)}
      />

      <PageTransition>
        <Rail />

        <main className="min-h-dvh pl-40 md:pl-56 lg:pl-64">{children}</main>

        <InfoDialog />
        <AuthDialog />
        <ArtworkDetail />
      </PageTransition>
    </>
  );
}
