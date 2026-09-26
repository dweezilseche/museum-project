"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

const TransitionContext = createContext(null);

export function usePageTransition() {
  return useContext(TransitionContext);
}

// A panel wipes up on navigation. `navigate` covers the screen then pushes the
// route; the destination page calls `reveal` on mount to uncover — tying the
// reveal to the real page mount instead of a fragile cross-navigation timeline.
// `overlayClassName` sets the panel's look (colour), so it's easy to reskin.
export default function PageTransition({
  children,
  overlayClassName = "bg-foreground",
}) {
  const overlayRef = useRef(null);
  const covered = useRef(false);
  const router = useRouter();

  // Let GSAP own the transform from the start (a CSS transform baseline would
  // be combined with GSAP's yPercent and cancel it out).
  useEffect(() => {
    gsap.set(overlayRef.current, { yPercent: 100, opacity: 1 });
  }, []);

  const navigate = (href) => {
    const overlay = overlayRef.current;

    if (!overlay) {
      router.push(href);
      return;
    }

    gsap.killTweensOf(overlay);
    gsap.set(overlay, { pointerEvents: "auto" });
    gsap.fromTo(
      overlay,
      { yPercent: 100 },
      {
        yPercent: 0,
        duration: 0.45,
        ease: "power3.inOut",
        onComplete: () => {
          covered.current = true;
          router.push(href);
        },
      },
    );
  };

  const reveal = () => {
    if (!covered.current) return;
    covered.current = false;

    const overlay = overlayRef.current;
    if (!overlay) return;

    gsap.killTweensOf(overlay);
    gsap.set(overlay, { yPercent: 0 });
    gsap.to(overlay, {
      yPercent: -100,
      duration: 0.6,
      ease: "power3.inOut",
      onComplete: () => gsap.set(overlay, { pointerEvents: "none" }),
    });
  };

  return (
    <TransitionContext.Provider value={{ navigate, reveal }}>
      {children}
      <div
        ref={overlayRef}
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[90] opacity-0 ${overlayClassName}`}
      />
    </TransitionContext.Provider>
  );
}

// A link that plays the transition instead of navigating instantly.
export function TransitionLink({ href, className, children, ...rest }) {
  const transition = usePageTransition();

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        transition?.navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
