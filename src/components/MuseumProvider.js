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
    throw new Error("useMuseum doit être utilisé dans <MuseumProvider>");
  }

  return context;
}

export default function MuseumProvider({ artists, children }) {
  const [artistIndex, setArtistIndexState] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const artist = artists[artistIndex] ?? artists[0];
  const works = useMemo(() => artist?.works ?? [], [artist]);
  const work = works[imageIndex] ?? works[0];

  const setArtistIndex = useCallback((index) => {
    setArtistIndexState(index);
    setImageIndex(0);
  }, []);

  const selectArtistBySlug = useCallback(
    (slug) => {
      const index = artists.findIndex((entry) => entry.slug === slug);

      if (index !== -1) {
        setArtistIndex(index);
      }
    },
    [artists, setArtistIndex],
  );

  // Jump straight to one artwork (used from the archive / overview grids).
  const openWork = useCallback(
    (slug, workId) => {
      const aIndex = artists.findIndex((entry) => entry.slug === slug);

      if (aIndex === -1) return;

      const wIndex = artists[aIndex].works.findIndex(
        (entry) => entry.id === workId,
      );

      setArtistIndexState(aIndex);
      setImageIndex(wIndex === -1 ? 0 : wIndex);
    },
    [artists],
  );

  const nextImage = useCallback(() => {
    setImageIndex((index) => (index + 1) % works.length);
  }, [works.length]);

  const prevImage = useCallback(() => {
    setImageIndex((index) => (index - 1 + works.length) % works.length);
  }, [works.length]);

  const nextArtist = useCallback(() => {
    setArtistIndex((artistIndex + 1) % artists.length);
  }, [artistIndex, artists.length, setArtistIndex]);

  const prevArtist = useCallback(() => {
    setArtistIndex((artistIndex - 1 + artists.length) % artists.length);
  }, [artistIndex, artists.length, setArtistIndex]);

  const value = useMemo(
    () => ({
      artists,
      artist,
      works,
      work,
      artistIndex,
      imageIndex,
      setArtistIndex,
      selectArtistBySlug,
      openWork,
      goToImage: setImageIndex,
      nextImage,
      prevImage,
      nextArtist,
      prevArtist,
      menuOpen,
      setMenuOpen,
      infoOpen,
      setInfoOpen,
    }),
    [
      artists,
      artist,
      works,
      work,
      artistIndex,
      imageIndex,
      setArtistIndex,
      selectArtistBySlug,
      openWork,
      nextImage,
      prevImage,
      nextArtist,
      prevArtist,
      menuOpen,
      infoOpen,
    ],
  );

  return (
    <MuseumContext.Provider value={value}>{children}</MuseumContext.Provider>
  );
}
