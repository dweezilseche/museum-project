"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { useMuseum } from "@/components/MuseumProvider";
import Media from "@/components/Media";

/* -------------------------------------------------------------------------- */
/* Intro loader — a small image scales up while the white veil lifts.         */
/* -------------------------------------------------------------------------- */

function IntroLoader() {
  const { artists } = useMuseum();
  const [done, setDone] = useState(true);
  const root = useRef(null);

  const firstImage = artists?.[0]?.works?.[0]?.image;

  useEffect(() => {
    // One-time, client-only decision: play the intro unless already seen.
    try {
      if (!sessionStorage.getItem("museum-intro")) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDone(false);
      }
    } catch {
      // sessionStorage unavailable — just skip the intro.
    }
  }, []);

  useGSAP(
    () => {
      if (done || !firstImage) return;

      const finish = () => {
        try {
          sessionStorage.setItem("museum-intro", "1");
        } catch {}
        setDone(true);
      };

      const tl = gsap.timeline({ onComplete: finish });

      tl.fromTo(
        ".intro-image",
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: "power2.out" },
      )
        .to(".intro-image", { scale: 1.05, duration: 0.6, ease: "power1.inOut" })
        .to(root.current, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, "-=0.1");
    },
    { scope: root, dependencies: [done, firstImage] },
  );

  if (done || !firstImage) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <div className="intro-image relative aspect-[4/5] w-[22vw] min-w-40 overflow-hidden">
        <Media src={firstImage} alt="" preload loading="eager" sizes="30vw" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Information dialog                                                          */
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
        className="nav-link fixed right-6 top-8 z-10 text-base md:right-16 md:top-14"
      >
        Fermer
      </button>

      <div className="mx-auto max-w-3xl">
        <h2 className="max-w-2xl text-3xl leading-[1.15] md:text-5xl">
          Une collection d&apos;œuvres majeures, présentée artiste par artiste.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
          <section>
            <h3 className="mb-4 text-muted">Mouvements</h3>
            <p className="leading-relaxed">{movements.join(", ")}.</p>
          </section>

          <section>
            <h3 className="mb-4 text-muted">À propos</h3>
            <p className="leading-relaxed">
              {artists.length} artistes, de la Renaissance au XXᵉ siècle.
              Chaque artiste ouvre une salle : parcourez ses œuvres une à une,
              ou passez à l&apos;archive complète pour tout embrasser d&apos;un
              regard.
            </p>
          </section>

          <section>
            <h3 className="mb-4 text-muted">Contact</h3>
            <button type="button" onClick={copyEmail} className="nav-link">
              {copied ? "Copié" : email}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Menu overlay — the list of artists (our "projects")                        */
/* -------------------------------------------------------------------------- */

function MenuOverlay() {
  const { artists, artistIndex, selectArtistBySlug, menuOpen, setMenuOpen } =
    useMuseum();
  const router = useRouter();

  if (!menuOpen) return null;

  const open = (slug) => {
    selectArtistBySlug(slug);
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-[60] flex flex-col bg-background px-6 pt-24 pb-10 md:px-16 md:pt-28">
      <ul className="mx-auto flex w-full max-w-4xl flex-col">
        {artists.map((artist, index) => (
          <li key={artist.slug}>
            <button
              type="button"
              onClick={() => open(artist.slug)}
              data-active={index === artistIndex}
              className="nav-link w-full py-1 text-left text-xl leading-tight md:text-3xl"
            >
              {artist.name}
              <span className="ml-3 align-super text-[0.6em] text-muted">
                {artist.works.length}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header + footer chrome                                                     */
/* -------------------------------------------------------------------------- */

export default function Chrome({ children }) {
  const { menuOpen, setMenuOpen, infoOpen, setInfoOpen } = useMuseum();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  // Close overlays with Escape.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setInfoOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMenuOpen, setInfoOpen]);

  const goHome = () => {
    setMenuOpen(false);
    setInfoOpen(false);
    router.push("/");
  };

  return (
    <>
      <IntroLoader />

      <header
        className={`fixed inset-x-0 top-0 z-[80] px-6 py-8 md:px-16 ${
          infoOpen ? "hidden" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <button
            type="button"
            onClick={goHome}
            className="nav-link text-base md:text-lg"
          >
            {menuOpen ? "MU" : "Museum"}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="nav-link text-base md:text-lg"
          >
            {menuOpen ? "Fermer" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <nav className="mt-1 flex items-start justify-between text-base md:text-lg">
            <Link href="/gallery" onClick={() => setMenuOpen(false)} className="nav-link">
              Aperçu
            </Link>
            <Link
              href="/archive"
              onClick={() => setMenuOpen(false)}
              className="nav-link absolute left-1/2 -translate-x-1/2"
            >
              Archive
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setInfoOpen(true);
              }}
              className="nav-link"
            >
              Information
            </button>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {isHome && !menuOpen && (
        <footer className="fixed inset-x-0 bottom-0 z-[50] flex items-center justify-between px-6 py-8 text-base md:px-16 md:text-lg">
          <Link href="/gallery" className="nav-link">
            Aperçu
          </Link>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="nav-link"
          >
            Information
          </button>
        </footer>
      )}

      <MenuOverlay />
      <InfoDialog />
    </>
  );
}
