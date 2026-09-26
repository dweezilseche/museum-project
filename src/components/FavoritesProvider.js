"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { fetchFavorites, toggleFavorite } from "@/app/actions/favorites";

const FavoritesContext = createContext(null);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within <FavoritesProvider>");
  }
  return context;
}

// Holds the current user's favorites as a Set of work ids. Loads them once the
// session is authenticated, clears them on logout, and toggles optimistically
// (reverting if the server rejects the change).
export default function FavoritesProvider({ children }) {
  const { status } = useSession();
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;

    if (status === "authenticated") {
      fetchFavorites().then((list) => {
        if (!cancelled) setIds(new Set(list.map(String)));
      });
    } else if (status === "unauthenticated") {
      // Clear on logout — done in a microtask so the update isn't a
      // synchronous setState inside the effect body.
      Promise.resolve().then(() => {
        if (!cancelled) setIds((prev) => (prev.size === 0 ? prev : new Set()));
      });
    }

    return () => {
      cancelled = true;
    };
  }, [status]);

  const toggle = useCallback(
    (workId) => {
      const id = String(workId);
      const shouldAdd = !ids.has(id);

      setIds((prev) => {
        const next = new Set(prev);
        if (shouldAdd) next.add(id);
        else next.delete(id);
        return next;
      });

      toggleFavorite(id, shouldAdd).then((res) => {
        if (res?.ok) return;
        // Revert on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (shouldAdd) next.delete(id);
          else next.add(id);
          return next;
        });
      });
    },
    [ids],
  );

  const value = {
    status,
    ids,
    count: ids.size,
    isFavorite: (workId) => ids.has(String(workId)),
    toggle,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
