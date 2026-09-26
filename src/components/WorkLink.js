"use client";

import { useMuseum } from "@/components/MuseumProvider";

// Wraps an artwork thumbnail. It is a real link to /work/<slug> — so it is
// shareable, and cmd/ctrl-click still opens the standalone page in a new tab —
// but a plain left-click is intercepted to open the animated detail overlay in
// place (no navigation), passing the clicked image's rect as the FLIP origin.
export default function WorkLink({ work, className = "", children }) {
  const { openWork } = useMuseum();

  const onClick = (event) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return; // let the browser open the real link
    }
    event.preventDefault();
    const img = event.currentTarget.querySelector("img");
    openWork(work, img ?? null);
  };

  return (
    <a href={`/work/${work.slug}`} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
