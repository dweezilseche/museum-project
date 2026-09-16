"use client";

import { useState } from "react";
import NextImage from "next/image";
import { isWikimediaThumbnail, getWikimediaThumbnail } from "@/lib/wikimedia";

// A single image (or video) that fills its positioned parent and fades in from
// a soft blur once loaded — the "blur-up" reveal used on colelferguson.com.
// Wikimedia thumbnail URLs are re-sized to a width that actually exists (the
// API sometimes stores oversized 2560px variants that 404), and a neutral
// placeholder is shown when an image is missing at the source.
export default function Media({
  src,
  alt = "",
  fit = "cover",
  width = 1280,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  preload = false,
  loading = "lazy",
  className = "",
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const isVideo =
    src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".mov");
  const isRemote = /^https?:\/\//.test(src);
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  const displaySrc = isWikimediaThumbnail(src)
    ? getWikimediaThumbnail(src, width)
    : src;

  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={`h-full w-full ${fitClass} ${className}`}
      />
    );
  }

  if (errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f4f2ee] p-6 text-center">
        <span className="text-sm italic text-muted">{alt || "Image indisponible"}</span>
      </div>
    );
  }

  return (
    <NextImage
      src={displaySrc}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      loading={loading}
      unoptimized={isRemote}
      onLoad={() => setLoaded(true)}
      onError={() => setErrored(true)}
      className={`${fitClass} transition-[opacity,filter] duration-700 ease-out ${
        loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
      } ${className}`}
    />
  );
}
