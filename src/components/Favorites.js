"use client";

import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

import { useMuseum } from "@/components/MuseumProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import FavoriteButton from "@/components/FavoriteButton";
import { BlurImage, usePageTransition } from "@/animation";
import WorkLink from "@/components/WorkLink";
import { isWikimediaThumbnail, getWikimediaThumbnail } from "@/lib/wikimedia";

function sized(image, width) {
  return isWikimediaThumbnail(image)
    ? getWikimediaThumbnail(image, width)
    : image;
}

// The user's favorites — a dedicated, authenticated-only page. Works are
// resolved from the museum data against the favorite ids held in context, so
// removing one (via the heart) makes it disappear immediately.
export default function Favorites() {
  const { artists, setAuthOpen } = useMuseum();
  const { status } = useSession();
  const { ids } = useFavorites();
  const transition = usePageTransition();

  // Uncover the page-transition veil once mounted.
  useEffect(() => {
    transition?.reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const works = useMemo(
    () => artists.flatMap((artist) => artist.works),
    [artists],
  );

  const favorites = useMemo(
    () => works.filter((work) => ids.has(String(work.id))),
    [works, ids],
  );

  return (
    <section className="min-h-dvh px-6 pb-16 pt-8 md:px-16">
      <div className="mb-10 flex items-baseline gap-4">
        <h1>Favorites</h1>
        {status === "authenticated" && (
          <span className="text-muted tabular-nums">{favorites.length}</span>
        )}
      </div>

      {status === "loading" ? (
        <p className="text-muted">…</p>
      ) : status !== "authenticated" ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">
            Sign in to find your favorite works.
          </p>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="nav-link underline underline-offset-4"
          >
            Sign in
          </button>
        </div>
      ) : favorites.length === 0 ? (
        <p className="text-muted">
          No favorites yet. Add works with the heart.
        </p>
      ) : (
        <div className="columns-2 gap-6 md:columns-3 lg:columns-4">
          {favorites.map((work) => (
            <article
              key={work.id}
              className="relative mb-6 block break-inside-avoid"
            >
              <WorkLink work={work} className="group block">
                <span className="block w-full overflow-hidden">
                  <BlurImage
                    src={sized(work.image, 640)}
                    alt={work.title}
                    blur={false}
                    className="h-auto w-full object-cover"
                  />
                </span>
                <span className="mt-2 block text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {work.artist} — <span className="italic">{work.title}</span>
                </span>
              </WorkLink>

              <FavoriteButton
                workId={work.id}
                className="absolute right-2 top-2 rounded-full bg-background/70 p-1.5 backdrop-blur-sm"
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
