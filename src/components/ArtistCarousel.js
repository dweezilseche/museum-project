"use client";

import { useRef, useState } from "react";
import gsap from "gsap";

import FavoriteButton from "@/components/FavoriteButton";
import { BlurImage } from "@/animation";
import { isWikimediaThumbnail, getWikimediaThumbnail } from "@/lib/wikimedia";

// One artist's works shown one at a time. Clicking the left half of the image
// goes to the previous work, the right half to the next (wrapping around); a
// following "Prev"/"Next" cursor mirrors that, and a numbered nav jumps to any
// slide. Used only when an artist has more than one work.
export default function ArtistCarousel({ works, eager = false }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState("Next");
  const stageRef = useRef(null);
  const cursorRef = useRef(null);

  const count = works.length;
  const work = works[index];
  const src = isWikimediaThumbnail(work.image)
    ? getWikimediaThumbnail(work.image, 1280)
    : work.image;

  const go = (delta) => setIndex((i) => (i + delta + count) % count);

  const isNext = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    return event.clientX - rect.left > rect.width / 2;
  };

  const onMove = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    setDirection(isNext(event) ? "Next" : "Prev");
    gsap.set(cursorRef.current, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      xPercent: -50,
      yPercent: -50,
    });
  };

  return (
    <div data-plate className="flex w-full flex-col items-center">
      <div
        ref={stageRef}
        onPointerMove={onMove}
        onPointerEnter={() =>
          gsap.to(cursorRef.current, { autoAlpha: 1, duration: 0.2 })
        }
        onPointerLeave={() =>
          gsap.to(cursorRef.current, { autoAlpha: 0, duration: 0.2 })
        }
        onClick={(event) => go(isNext(event) ? 1 : -1)}
        className="relative flex w-full cursor-none items-center justify-center"
      >
        <figure
          key={work.id}
          className="animate-fade-in flex flex-col items-center"
        >
          <BlurImage
            src={src}
            alt={work.title}
            loading={eager ? "eager" : "lazy"}
            className="max-h-[58vh] w-auto max-w-full object-contain"
            fallback={
              <div className="flex aspect-[4/5] max-h-[58vh] w-full items-center justify-center bg-[#f4f2ee] p-6 text-center">
                <span className="italic text-muted">{work.title}</span>
              </div>
            }
          />
        </figure>

        <span
          ref={cursorRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10 italic uppercase tracking-wide text-white opacity-0 mix-blend-difference"
        >
          {direction}
        </span>
      </div>

      <figcaption className="mt-5 text-center">
        <p className="italic">{work.title}</p>
        {work.year ? <p className="text-muted">{work.year}</p> : null}
        <div className="mt-2 flex justify-center">
          <FavoriteButton workId={work.id} />
        </div>
      </figcaption>

      <nav className="mt-4 flex items-center gap-3" aria-label="Works">
        {works.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show work ${i + 1} of ${count}`}
            aria-current={i === index}
            className={
              i === index
                ? "tabular-nums text-foreground underline underline-offset-4"
                : "nav-link tabular-nums text-muted"
            }
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </nav>
    </div>
  );
}
