"use client";

import { useEffect, useRef, useState } from "react";

// Reusable <img> that fades (and optionally un-blurs) in once loaded, and
// falls back to a neutral box when the source is missing. Framework-agnostic:
// pass a ready-to-use `src` and style everything through `className`.
export default function BlurImage({
  src,
  alt = "",
  className = "",
  loading = "lazy",
  blur = true,
  durationMs = 600,
  fallback,
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const ref = useRef(null);

  // A cached image can already be complete before React attaches onLoad.
  useEffect(() => {
    const el = ref.current;
    if (!el || !el.complete) return;
    if (el.naturalWidth > 0) setLoaded(true);
    else setErrored(true);
  }, [src]);

  if (errored) {
    return (
      fallback ?? (
        <span className="flex h-full w-full items-center justify-center bg-[#f4f2ee] p-4 text-center">
          <span className="italic text-muted">{alt}</span>
        </span>
      )
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      onLoad={() => setLoaded(true)}
      onError={() => setErrored(true)}
      style={{ transitionDuration: `${durationMs}ms` }}
      className={`${className} transition-[opacity,filter] ease-out ${
        loaded ? "opacity-100 blur-0" : `opacity-0 ${blur ? "blur-md" : ""}`
      }`}
    />
  );
}
