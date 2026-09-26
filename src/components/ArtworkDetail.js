"use client";

import { useEffect } from "react";

import { useMuseum } from "@/components/MuseumProvider";
import ArtworkView from "@/components/ArtworkView";

// The in-place artwork overlay. Opening pushes a shareable /work/<slug> entry
// onto the history stack (no navigation — Next supports native pushState), so
// the browser Back button and Escape both close it and restore the URL.
export default function ArtworkDetail() {
  const { detail, closeWork } = useMuseum();

  useEffect(() => {
    if (!detail) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.history.pushState({ __work: detail.work.slug }, "", `/work/${detail.work.slug}`);

    const onPop = () => closeWork();
    window.addEventListener("popstate", onPop);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("popstate", onPop);
    };
  }, [detail, closeWork]);

  if (!detail) return null;

  return (
    <div
      role="dialog"
      aria-label={detail.work.title}
      className="fixed inset-0 z-[85]"
    >
      <ArtworkView
        work={detail.work}
        origin={detail.originEl}
        overlay
        onClose={() => window.history.back()}
      />
    </div>
  );
}
