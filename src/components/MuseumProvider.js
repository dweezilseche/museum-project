"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const MuseumContext = createContext(null);

export function useMuseum() {
  const context = useContext(MuseumContext);

  if (!context) {
    throw new Error("useMuseum must be used within <MuseumProvider>");
  }

  return context;
}

export default function MuseumProvider({ artists, children }) {
  // The artist currently in view on the home scroll — drives the left rail.
  const [activeArtistSlug, setActiveArtistSlug] = useState(
    artists[0]?.slug ?? null,
  );
  const [infoOpen, setInfoOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  // The artwork opened in the detail overlay: { work, originEl } | null.
  // `originEl` is the clicked thumbnail element — its live bounding box is the
  // FLIP origin, read again on close so the image returns to the right place.
  const [detail, setDetail] = useState(null);
  // Flips true once the preloader has lifted — gates the first reveal.
  const [introDone, setIntroDone] = useState(false);

  const openWork = useCallback((work, originEl = null) => {
    setDetail({ work, originEl });
  }, []);
  const closeWork = useCallback(() => setDetail(null), []);

  const value = useMemo(
    () => ({
      artists,
      activeArtistSlug,
      setActiveArtistSlug,
      infoOpen,
      setInfoOpen,
      authOpen,
      setAuthOpen,
      detail,
      openWork,
      closeWork,
      introDone,
      setIntroDone,
    }),
    [artists, activeArtistSlug, infoOpen, authOpen, detail, openWork, closeWork, introDone],
  );

  return (
    <MuseumContext.Provider value={value}>{children}</MuseumContext.Provider>
  );
}
