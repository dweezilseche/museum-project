"use client";

import { useRouter } from "next/navigation";

import ArtworkView from "@/components/ArtworkView";

// Standalone /work/<slug> view (direct visits, reloads, shared links, new tabs).
// No FLIP origin — the image fades in and the text reveals on mount.
export default function ArtworkPageClient({ work }) {
  const router = useRouter();

  const onClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/gallery");
    }
  };

  return (
    <div className="min-h-dvh">
      <ArtworkView work={work} onClose={onClose} />
    </div>
  );
}
