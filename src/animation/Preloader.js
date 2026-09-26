"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

// Reusable site preloader: a wordmark + a 0→100 counter, then the veil wipes
// up to reveal the page. Runs once per session (sessionStorage). `onReveal`
// fires the moment the page becomes visible (veil lift, or immediately when
// skipped) — wire it to trigger your first content animation.
export default function Preloader({
  label = "",
  sessionKey = "preloader-seen",
  onReveal,
  counter = true,
  countDuration = 1.4,
}) {
  const [active, setActive] = useState(false);
  const root = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(sessionKey);
    } catch {}

    if (seen) {
      onReveal?.();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(
    () => {
      if (!active) return;

      const value = { n: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem(sessionKey, "1");
          } catch {}
          setActive(false);
        },
      });

      tl.to(value, {
        n: 100,
        duration: countDuration,
        ease: "power1.inOut",
        onUpdate: () => {
          if (countRef.current) {
            countRef.current.textContent = String(Math.round(value.n)).padStart(
              2,
              "0",
            );
          }
        },
      })
        .to(".preloader-fade", { opacity: 0, duration: 0.3 }, "-=0.05")
        .to(
          root.current,
          {
            yPercent: -100,
            duration: 0.8,
            ease: "power3.inOut",
            onStart: () => onReveal?.(),
          },
          "-=0.1",
        );
    },
    { scope: root, dependencies: [active] },
  );

  if (!active) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
    >
      <span className="preloader-fade text-3xl md:text-4xl">{label}</span>
      {counter && (
        <span
          ref={countRef}
          className="preloader-fade mt-4 tabular-nums text-muted"
        >
          00
        </span>
      )}
    </div>
  );
}
