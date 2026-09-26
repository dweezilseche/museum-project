"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMuseum } from "@/components/MuseumProvider";
import { BlurImage, useFlipMorph, usePageTransition } from "@/animation";
import FavoriteButton from "@/components/FavoriteButton";
import WorkLink from "@/components/WorkLink";
import { isWikimediaThumbnail, getWikimediaThumbnail } from "@/lib/wikimedia";

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function sized(image, width) {
  return isWikimediaThumbnail(image)
    ? getWikimediaThumbnail(image, width)
    : image;
}

export default function Overview() {
  const { artists } = useMuseum();
  const transition = usePageTransition();
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  const cardsRef = useRef(null);
  const captureFlip = useFlipMorph([view]);

  // Uncover the page-transition veil once mounted.
  useEffect(() => {
    transition?.reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const works = useMemo(
    () => artists.flatMap((artist) => artist.works),
    [artists],
  );

  const filtered = useMemo(() => {
    const query = normalize(search);
    if (!query) return works;
    return works.filter((work) =>
      [work.title, work.artist, work.movement, work.year]
        .filter(Boolean)
        .map(normalize)
        .join(" ")
        .includes(query),
    );
  }, [search, works]);

  const changeView = (next) => {
    if (next === view || !cardsRef.current) return;
    // Snapshot the shared media boxes, then let the layout switch morph them.
    captureFlip(cardsRef.current.querySelectorAll("[data-media]"));
    setView(next);
  };

  const hoveredWork =
    filtered.find((work) => work.id === hoveredId) ?? filtered[0];

  const isList = view === "list";

  return (
    <section className="min-h-dvh px-6 pb-16 pt-8 md:px-16">
      {/* Controls */}
      <div className="mb-10 flex flex-wrap items-baseline gap-x-8 gap-y-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search an artist, a work, a movement…"
          className="min-w-0 flex-1 border-0 border-b border-foreground/20 bg-transparent pb-1 outline-none placeholder:text-muted focus:border-foreground"
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => changeView("grid")}
            className={
              view === "grid"
                ? "text-foreground underline underline-offset-4"
                : "nav-link"
            }
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => changeView("list")}
            className={
              isList
                ? "text-foreground underline underline-offset-4"
                : "nav-link"
            }
          >
            List
          </button>
          <span className="text-muted tabular-nums">{filtered.length}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">No results for “{search}”.</p>
      ) : (
        <div className={isList ? "flex items-start gap-12" : "block"}>
          {/* Cards — same elements in both views, morphed with Flip */}
          <div
            ref={cardsRef}
            className={
              isList
                ? "w-1/2 shrink-0"
                : "columns-2 gap-6 md:columns-3 lg:columns-4"
            }
          >
            {filtered.map((work) => (
              <article
                key={work.id}
                onMouseEnter={() => isList && setHoveredId(work.id)}
                className={
                  isList
                    ? "relative border-b border-foreground/10"
                    : "relative mb-6 block break-inside-avoid"
                }
              >
                <WorkLink
                  work={work}
                  className={
                    isList
                      ? "nav-link flex items-center gap-4 py-2.5"
                      : "group block"
                  }
                >
                  <span
                    data-media
                    className={
                      isList
                        ? "block h-11 w-16 shrink-0 overflow-hidden"
                        : "block w-full overflow-hidden"
                    }
                  >
                    <BlurImage
                      src={sized(work.image, isList ? 250 : 640)}
                      alt={work.title}
                      blur={false}
                      className={
                        isList
                          ? "h-full w-full object-cover"
                          : "h-auto w-full object-cover"
                      }
                    />
                  </span>

                  {isList ? (
                    <span className="flex flex-1 items-baseline justify-between gap-6">
                      <span className="italic">{work.title}</span>
                      <span className="shrink-0 text-muted">
                        {work.artist}
                        {work.year ? `, ${work.year}` : ""}
                      </span>
                    </span>
                  ) : (
                    <span className="mt-2 block text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {work.artist} —{" "}
                      <span className="italic">{work.title}</span>
                    </span>
                  )}

                  {isList && (
                    <FavoriteButton workId={work.id} className="ml-2 shrink-0" />
                  )}
                </WorkLink>

                {!isList && (
                  <FavoriteButton
                    workId={work.id}
                    className="absolute right-2 top-2 rounded-full bg-background/70 p-1.5 backdrop-blur-sm"
                  />
                )}
              </article>
            ))}
          </div>

          {/* Preview panel — list view only */}
          {isList && (
            <aside className="sticky top-8 flex-1 self-start">
              <div className="relative flex h-[70vh] w-full items-center justify-center">
                {hoveredWork && (
                  <BlurImage
                    key={hoveredWork.id}
                    src={sized(hoveredWork.image, 960)}
                    alt={hoveredWork.title}
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                )}
              </div>
              {hoveredWork && (
                <p className="mt-4 text-center text-muted">
                  <span className="italic">{hoveredWork.title}</span>
                  {hoveredWork.year ? `, ${hoveredWork.year}` : ""} —{" "}
                  {hoveredWork.artist}
                </p>
              )}
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
