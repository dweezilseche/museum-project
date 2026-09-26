"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// For a scroll-snap container: replay an "apparition" on the items of whichever
// section settles at the centre of the viewport, keeping the other sections
// pre-hidden off-screen so nothing flashes mid-scroll. Selectors and the
// from/to tweens are configurable, so it works for any snap layout.
export function useSettleReveal(
  containerRef,
  {
    enabled = true,
    sectionSelector = "[data-reveal-section]",
    itemSelector = "[data-reveal-item]",
    delay = 0.05,
    from = { opacity: 0, y: 28 },
    to = { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" },
  } = {},
) {
  // Keep the tween config in a ref so new object literals don't re-subscribe
  // the scroll listener on every render.
  const cfg = useRef({ from, to });
  useEffect(() => {
    cfg.current = { from, to };
  });

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const sections = [...container.querySelectorAll(sectionSelector)];
    let timer;
    let last = null;

    const centeredSection = () => {
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
      return best;
    };

    const revealSettled = () => {
      const best = centeredSection();
      if (!best || best === last) return;
      last = best;

      for (const section of sections) {
        if (section !== best) {
          gsap.set(section.querySelectorAll(itemSelector), cfg.current.from);
        }
      }
      gsap.fromTo(
        best.querySelectorAll(itemSelector),
        cfg.current.from,
        cfg.current.to,
      );
    };

    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(revealSettled, delay);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    revealSettled();

    return () => {
      container.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [enabled, containerRef, sectionSelector, itemSelector, delay]);
}
