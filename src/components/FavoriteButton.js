"use client";

import { useFavorites } from "@/components/FavoritesProvider";

// A heart toggle rendered only for authenticated users. Placed inside links /
// figures, so it stops the click from bubbling to a navigation.
export default function FavoriteButton({ workId, className = "" }) {
  const { status, isFavorite, toggle } = useFavorites();

  if (status !== "authenticated") return null;

  const active = isFavorite(workId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(workId);
      }}
      className={`inline-flex items-center justify-center text-foreground transition-opacity hover:opacity-60 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M12 20.5S3.5 14.6 3.5 8.9A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8.5 2c0 5.7-8.5 11.6-8.5 11.6Z" />
      </svg>
    </button>
  );
}
