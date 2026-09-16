"use client";

import { useEffect } from "react";
import { useMuseum } from "@/components/MuseumProvider";
import Media from "@/components/Media";

export default function Slideshow() {
  const { artist, works, work, imageIndex, goToImage, nextImage, prevImage } =
    useMuseum();

  const multiple = works.length > 1;

  // Arrow keys move through the current artist's works.
  useEffect(() => {
    if (!multiple) return;

    const onKey = (event) => {
      if (event.key === "ArrowRight") nextImage();
      if (event.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multiple, nextImage, prevImage]);

  if (!work) return null;

  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 py-28">
      {/* Stage */}
      <div className="relative flex h-[58vh] w-full max-w-[52rem] items-center justify-center">
        <div
          key={work.id}
          className="animate-fade-in relative h-full w-full"
        >
          <Media
            src={work.image}
            alt={`${work.title} — ${artist.name}`}
            fit="contain"
            preload
            loading="eager"
            sizes="(max-width: 768px) 90vw, 52rem"
          />
        </div>

        {/* Click zones for previous / next image */}
        {multiple && (
          <>
            <button
              type="button"
              aria-label="Image précédente"
              onClick={prevImage}
              className="absolute left-0 top-0 h-full w-1/2 cursor-w-resize"
            />
            <button
              type="button"
              aria-label="Image suivante"
              onClick={nextImage}
              className="absolute right-0 top-0 h-full w-1/2 cursor-e-resize"
            />
          </>
        )}
      </div>

      {/* Caption */}
      <div className="mt-8 text-center">
        <p className="text-lg md:text-xl">{artist.name}</p>
        <p className="text-muted">
          <span className="italic">{work.title}</span>
          {work.year ? `, ${work.year}` : ""}
        </p>
      </div>

      {/* Pagination */}
      {multiple && (
        <div className="mt-3 flex items-center gap-3 text-base text-muted">
          {works.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => goToImage(index)}
              aria-label={`Aller à l'image ${index + 1}`}
              className={`nav-link tabular-nums ${
                index === imageIndex
                  ? "text-foreground underline underline-offset-4"
                  : ""
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
