"use client";

import { useEffect, useRef } from "react";
import { useMuseum } from "@/components/MuseumProvider";
import FavoriteButton from "@/components/FavoriteButton";
import WorkLink from "@/components/WorkLink";
import ArtistCarousel from "@/components/ArtistCarousel";
import { BlurImage, usePageTransition, useSettleReveal } from "@/animation";
import { isWikimediaThumbnail, getWikimediaThumbnail } from "@/lib/wikimedia";

// One artwork, sized to a natural aspect at a capped height so an artist's
// works can sit side by side inside a single screen.
function Plate({ work, count, eager }) {
  const src = isWikimediaThumbnail(work.image)
    ? getWikimediaThumbnail(work.image, count > 1 ? 960 : 1280)
    : work.image;

  const maxH =
    count >= 3 ? "max-h-[46vh]" : count === 2 ? "max-h-[54vh]" : "max-h-[62vh]";

  return (
    <figure
      id={`work-${work.id}`}
      data-plate
      className="flex min-w-0 flex-1 flex-col items-center"
    >
      <WorkLink work={work} className="block">
        <BlurImage
          src={src}
          alt={work.title}
          loading={eager ? "eager" : "lazy"}
          className={`${maxH} w-auto max-w-full object-contain`}
          fallback={
            <div
              className={`flex ${maxH} aspect-[4/5] w-full items-center justify-center bg-[#f4f2ee] p-6 text-center`}
            >
              <span className="italic text-muted">{work.title}</span>
            </div>
          }
        />
      </WorkLink>

      <figcaption className="mt-5 text-center">
        <p className="italic">{work.title}</p>
        {work.year ? <p className="text-muted">{work.year}</p> : null}
        <div className="mt-2 flex justify-center">
          <FavoriteButton workId={work.id} />
        </div>
      </figcaption>
    </figure>
  );
}

// Home page: a magnetic, one-artist-per-screen scroll. Each snap section holds
// all of that artist's works; the section snapped into view becomes the active
// artist shown (centered) in the rail.
export default function ScrollGallery() {
  const { artists, setActiveArtistSlug, introDone } = useMuseum();
  const transition = usePageTransition();
  const containerRef = useRef(null);

  // Uncover the page-transition veil once this page has mounted.
  useEffect(() => {
    transition?.reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The artist whose section is closest to the centre of the viewport is the
  // active one — kept in sync for the rail.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = [...container.querySelectorAll("[data-artist]")];
    let raf = 0;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      let best = null;
      let bestDistance = Infinity;
      for (const section of sections) {
        const r = section.getBoundingClientRect();
        const distance = Math.abs(r.top + r.height / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = section;
        }
      }

      if (best) setActiveArtistSlug(best.dataset.artist);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [artists, setActiveArtistSlug]);

  // Jump to the anchor coming from the rail / overview once mounted.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "center" });
  }, []);

  // Reusable apparition: reveal the works of each artist as their section
  // settles at the centre (once the preloader has lifted).
  useSettleReveal(containerRef, {
    enabled: introDone,
    sectionSelector: "[data-artist]",
    itemSelector: "[data-plate]",
  });

  return (
    <div
      ref={containerRef}
      className="h-dvh snap-y snap-mandatory overflow-y-auto [scrollbar-width:none]"
    >
      {artists.map((artist, artistIndex) => (
        <section
          key={artist.slug}
          id={`artist-${artist.slug}`}
          data-artist={artist.slug}
          className="flex h-dvh snap-center snap-always items-center justify-center px-6 md:px-16"
        >
          <div className="flex w-full items-center justify-center">
            {artist.works.length > 1 ? (
              <ArtistCarousel
                works={artist.works}
                eager={artistIndex === 0}
              />
            ) : (
              <Plate work={artist.works[0]} count={1} eager={artistIndex === 0} />
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
