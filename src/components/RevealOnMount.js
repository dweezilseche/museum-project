"use client";

import { useEffect } from "react";

import { usePageTransition } from "@/animation";

// Lifts the page-transition veil once a Server Component page has mounted
// (server pages can't call the reveal hook themselves).
export default function RevealOnMount({ children }) {
  const transition = usePageTransition();

  useEffect(() => {
    transition?.reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
