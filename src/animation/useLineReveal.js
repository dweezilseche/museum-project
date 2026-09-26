"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

// Reveal the text inside `containerRef` line by line with GSAP SplitText, each
// line sliding up from behind a mask. To avoid a flash of un-animated text, the
// container must start hidden (e.g. inline `opacity: 0`); this hook splits the
// lines, pins them to their hidden start state, *then* shows the container and
// plays the reveal — so the plain text is never painted first. It also waits
// for web fonts so line breaks are measured against the final metrics.
export function useLineReveal(
  containerRef,
  { enabled = true, delay = 0, stagger = 0.05, duration = 0.7, y = 100 } = {},
) {
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    let split;
    let tween;
    let raf;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      split = new SplitText(container, {
        type: "lines",
        mask: "lines",
        linesClass: "reveal-line",
      });
      // Hide the lines, reveal the container, then play — no flash of raw text.
      gsap.set(split.lines, { yPercent: y, opacity: 0 });
      gsap.set(container, { autoAlpha: 1 });
      tween = gsap.to(split.lines, {
        yPercent: 0,
        opacity: 1,
        duration,
        stagger,
        delay,
        ease: "power3.out",
      });
    };

    const start = () => {
      raf = requestAnimationFrame(run);
    };

    // Split only once the fonts are ready, otherwise line breaks can shift.
    if (typeof document !== "undefined" && document.fonts?.status !== "loaded") {
      document.fonts.ready.then(start);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      tween?.kill();
      split?.revert();
    };
  }, [containerRef, enabled, delay, stagger, duration, y]);
}
