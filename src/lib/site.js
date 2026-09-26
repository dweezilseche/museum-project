// Single source of truth for the site's public origin. Used by metadataBase,
// the sitemap and robots so every absolute URL stays consistent. Set
// NEXT_PUBLIC_SITE_URL in the environment for production; falls back to the dev
// server so everything works locally without configuration.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "Museum";

export const SITE_DESCRIPTION =
  "A collection of works, presented artist by artist — browse the galleries, discover each piece, and book your visit.";

// Build an absolute URL from a site-relative path.
export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
