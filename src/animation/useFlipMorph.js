"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(Flip);

// Animate a layout change with GSAP Flip. Call the returned `capture(targets)`
// with the elements to morph *right before* the state change that alters their
// layout; once `deps` change and React has re-rendered, the elements glide from
// their old boxes to their new ones.
//
//   const capture = useFlipMorph([view]);
//   const toggle = (next) => { capture(refs()); setView(next); };
export function useFlipMorph(deps, options = {}) {
  const stateRef = useRef(null);

  const capture = (targets) => {
    if (targets) stateRef.current = Flip.getState(targets);
  };

  useLayoutEffect(() => {
    if (!stateRef.current) return;
    Flip.from(stateRef.current, {
      duration: 0.6,
      ease: "power3.inOut",
      absolute: true,
      ...options,
    });
    stateRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return capture;
}
