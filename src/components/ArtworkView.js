"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

import FavoriteButton from "@/components/FavoriteButton";
import { useLineReveal } from "@/animation";
import { isWikimediaThumbnail, getWikimediaThumbnail } from "@/lib/wikimedia";

function sized(image, width) {
  return isWikimediaThumbnail(image)
    ? getWikimediaThumbnail(image, width)
    : image;
}

const ENTITIES = {
  "&amp;": "&",
  "&nbsp;": " ",
  "&#39;": "'",
  "&apos;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
};

// Turn the API's HTML description into an array of plain-text paragraphs. Plain
// text keeps SplitText's line splitting clean and avoids injecting raw HTML.
function htmlToParagraphs(html = "") {
  return String(html)
    .split(/<\/p>/i)
    .map((chunk) =>
      chunk
        .replace(/<[^>]+>/g, "")
        .replace(
          /&amp;|&nbsp;|&#39;|&apos;|&quot;|&lt;|&gt;/g,
          (m) => ENTITIES[m],
        )
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

const capitalize = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

// The artwork on the left, its explanation on the right. Used both inside the
// in-place overlay (`overlay` + a FLIP `origin` element) and on the standalone
// /work page (no origin — the image fades in). Opening flies the image from the
// thumbnail and reveals the text line by line; closing reverses the flight so
// the image settles back onto its thumbnail before the overlay unmounts.
export default function ArtworkView({ work, origin = null, overlay = false, onClose }) {
  const bgRef = useRef(null);
  const imageRef = useRef(null);
  const textRef = useRef(null);
  const rightRef = useRef(null);
  const heartRef = useRef(null);
  const closingRef = useRef(false);

  const [imageIn, setImageIn] = useState(false);
  const [errored, setErrored] = useState(false);

  const paragraphs = useMemo(
    () => htmlToParagraphs(work.description),
    [work.description],
  );

  const meta = [work.movement, capitalize(work.type), work.location]
    .filter(Boolean)
    .join("  ·  ");

  // Reconcile a cached image that completed before React attached onLoad.
  useEffect(() => {
    const img = imageRef.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth > 0) setImageIn((v) => v || "ready");
    else setErrored(true);
  }, []);

  // Hide the source thumbnail while the overlay is open, so the flying image is
  // the only copy on screen (otherwise, as the backdrop fades on close, the
  // thumbnail underneath shows through and you briefly see the artwork twice).
  // We toggle `visibility` rather than `opacity`: the thumbnail is a BlurImage
  // whose opacity is transitioned over 600ms, so restoring it via opacity would
  // replay that fade/blur as the flying image lands. `visibility` is not a
  // transitioned property, so the handoff is instant. The layout box is kept
  // (hidden, not removed), so the FLIP rect stays valid.
  useEffect(() => {
    if (!overlay || !origin) return;
    gsap.set(origin, { visibility: "hidden" });
    return () => {
      gsap.set(origin, { clearProps: "visibility" });
    };
  }, [overlay, origin]);

  // Fade the overlay backdrop in on open.
  useEffect(() => {
    if (!overlay || !bgRef.current) return;
    const t = gsap.fromTo(
      bgRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.25, ease: "power1.out" },
    );
    return () => t.kill();
  }, [overlay]);

  // Animate the image in: FLIP from the clicked thumbnail's rect when we have
  // an origin, otherwise a gentle fade. Runs once the image reports its size.
  useEffect(() => {
    if (imageIn !== "ready") return;
    const img = imageRef.current;
    if (!img) return;

    const first = origin?.getBoundingClientRect?.();
    if (!origin || !first || !first.width) {
      const t = gsap.fromTo(
        img,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => setImageIn("done"),
        },
      );
      return () => t.kill();
    }

    const last = img.getBoundingClientRect();
    gsap.set(img, {
      autoAlpha: 1,
      transformOrigin: "top left",
      x: first.left - last.left,
      y: first.top - last.top,
      scaleX: first.width / last.width,
      scaleY: first.height / last.height,
    });
    const t = gsap.to(img, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.7,
      ease: "power3.inOut",
      onComplete: () => setImageIn("done"),
    });
    return () => t.kill();
  }, [imageIn, origin]);

  // Reveal the description as soon as the image starts moving (or on error),
  // slightly delayed so the two motions overlap into one fluid entrance.
  useLineReveal(textRef, {
    enabled: errored || imageIn !== false,
    delay: origin ? 0.3 : 0.2,
  });

  // Animated close: fly the image back to its thumbnail while the text and
  // backdrop fade, then hand off to `onClose` (which unmounts / navigates).
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const img = imageRef.current;
    const first = origin?.getBoundingClientRect?.();

    if (!img || !first || !first.width) {
      // Nothing to fly back to — fade out and close.
      const target = overlay ? bgRef.current : imageRef.current;
      if (target) {
        gsap.to([target, rightRef.current, heartRef.current], {
          autoAlpha: 0,
          duration: 0.3,
          onComplete: onClose,
        });
      } else {
        onClose?.();
      }
      return;
    }

    const last = img.getBoundingClientRect();
    gsap.to([rightRef.current, heartRef.current], {
      autoAlpha: 0,
      duration: 0.25,
      ease: "power1.out",
    });
    if (bgRef.current) {
      gsap.to(bgRef.current, {
        autoAlpha: 0,
        duration: 0.55,
        ease: "power2.inOut",
      });
    }
    gsap.to(img, {
      x: first.left - last.left,
      y: first.top - last.top,
      scaleX: first.width / last.width,
      scaleY: first.height / last.height,
      transformOrigin: "top left",
      duration: 0.6,
      ease: "power3.inOut",
      overwrite: true,
      onComplete: onClose,
    });
  }, [origin, overlay, onClose]);

  // Escape closes (with the same exit animation).
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return (
    <div className="relative h-full w-full">
      {overlay && (
        <div ref={bgRef} className="absolute inset-0 bg-background" />
      )}

      <div className="relative flex h-full w-full flex-col overflow-y-auto md:flex-row">
        <button
          type="button"
          onClick={requestClose}
          className="nav-link fixed right-6 top-8 z-10 md:right-16 md:top-14"
        >
          Close
        </button>

        {/* Left — the work */}
        <div className="flex w-full shrink-0 items-center justify-center p-6 pt-16 md:h-dvh md:w-1/2 md:p-16">
          <div className="relative flex max-h-full items-center justify-center">
            {errored ? (
              <div className="flex aspect-[4/5] w-full max-w-md items-center justify-center bg-[#f4f2ee] p-6 text-center">
                <span className="italic text-muted">{work.title}</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={sized(work.image, 1280)}
                alt={work.title}
                onLoad={() => setImageIn((v) => (v === false ? "ready" : v))}
                onError={() => setErrored(true)}
                className="max-h-[70vh] w-auto max-w-full object-contain opacity-0 md:max-h-[80vh]"
              />
            )}
            <div ref={heartRef} className="absolute right-3 top-3">
              <FavoriteButton
                workId={work.id}
                className="rounded-full bg-background/70 p-1.5 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Right — the explanation */}
        <div
          ref={rightRef}
          className="flex w-full flex-col justify-center gap-8 p-6 pb-16 md:h-dvh md:w-1/2 md:overflow-y-auto md:p-16"
        >
          <header className="flex flex-col gap-1">
            <h1 className="text-3xl italic leading-tight md:text-4xl">
              {work.title}
            </h1>
            <p className="text-muted">
              {work.artist}
              {work.year ? `, ${work.year}` : ""}
            </p>
          </header>

          <div
            ref={textRef}
            className="flex flex-col leading-relaxed"
            style={{ opacity: 0 }}
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {meta && <footer className="text-muted">{meta}</footer>}
        </div>
      </div>
    </div>
  );
}
