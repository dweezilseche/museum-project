"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useMuseum } from "@/components/MuseumProvider";
import { usePageTransition, TransitionLink } from "@/animation";

// The whole navigation lives in a fixed rail on the left. The active artist is
// pinned to the vertical centre of the screen; previous artists sit above and
// the next ones below, hidden until the block is hovered. Museum sits at the
// top, Overview / Information at the bottom.
export default function Rail() {
  const {
    artists,
    activeArtistSlug,
    setActiveArtistSlug,
    infoOpen,
    setInfoOpen,
    setAuthOpen,
  } = useMuseum();
  const pathname = usePathname();
  const transition = usePageTransition();
  const { status } = useSession();
  const isAuth = status === "authenticated";
  const [expanded, setExpanded] = useState(false);

  const listRef = useRef(null);
  const activeRef = useRef(null);

  // Keep the active artist at the vertical centre of the list (which spans the
  // full screen height). Scroll only the list, never the page.
  useEffect(() => {
    const list = listRef.current;
    const item = activeRef.current;
    if (!list || !item) return;

    list.scrollTop =
      item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2;
  }, [activeArtistSlug]);

  const goToArtist = (slug) => {
    setActiveArtistSlug(slug);
    setExpanded(false);

    if (pathname !== "/") {
      transition?.navigate(`/#artist-${slug}`);
      return;
    }

    document
      .getElementById(`artist-${slug}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const goHome = () => {
    setExpanded(false);

    if (pathname !== "/") {
      transition?.navigate("/");
      return;
    }

    if (artists[0]) goToArtist(artists[0].slug);
  };

  if (infoOpen) return null;

  return (
    <nav className="fixed left-0 top-0 z-[80] h-dvh w-40 md:w-56 lg:w-64">
      <button
        type="button"
        onClick={goHome}
        className="nav-link absolute left-6 top-8 z-10 text-base md:left-8 md:text-lg"
      >
        Museum
      </button>

      {/* Artist list — active centred; hover reveals the neighbours. */}
      <div
        className="absolute inset-0"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <ul
          ref={listRef}
          className="flex h-full scroll-smooth flex-col items-start gap-1 overflow-y-auto px-6 py-[50dvh] md:px-8 [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent,#000_20%,#000_62%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_40%,#000_62%,transparent)]"
        >
          {artists.map((artist) => {
            const isActive = artist.slug === activeArtistSlug;

            return (
              <li key={artist.slug} className="w-full">
                <button
                  ref={isActive ? activeRef : null}
                  type="button"
                  onClick={() => goToArtist(artist.slug)}
                  className={`nav-link block w-full text-left text-sm leading-snug transition-opacity duration-300 md:text-base ${
                    isActive
                      ? "opacity-100"
                      : expanded
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                  }`}
                >
                  {artist.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="absolute bottom-8 left-6 z-10 flex flex-col gap-1 text-base md:left-8 md:text-sm">
        <TransitionLink href="/gallery" className="nav-link">
          Overview
        </TransitionLink>
        {isAuth && (
          <TransitionLink href="/favorites" className="nav-link">
            Favorites
          </TransitionLink>
        )}
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="nav-link text-left"
        >
          Information
        </button>
        <TransitionLink href="/tickets" className="nav-link">
          Tickets
        </TransitionLink>
        {isAuth && (
          <TransitionLink href="/tickets/mine" className="nav-link">
            My tickets
          </TransitionLink>
        )}

        {isAuth ? (
          <button
            type="button"
            onClick={() => signOut({ redirect: false })}
            className="nav-link mt-4 text-left text-muted"
          >
            Sign out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="nav-link mt-4 text-left"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
