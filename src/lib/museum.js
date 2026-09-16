const API_URL = "https://api-museum.vercel.app/objects";

export function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Server-side fetch. Next dedupes identical fetches within a render, and we
// revalidate once a day since the collection barely changes.
export async function getObjects() {
  const response = await fetch(API_URL, { next: { revalidate: 86400 } });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les œuvres du musée");
  }

  const data = await response.json();

  return Array.isArray(data) ? data : data.objects || data.data || [];
}

// Group the flat list of artworks by artist. Each artist becomes a "project"
// (a slideshow), mirroring how colelferguson.com is organised by project.
export async function getArtists() {
  const objects = await getObjects();

  const map = new Map();

  for (const object of objects) {
    const name = object.artist || "Inconnu";
    const slug = slugify(name);

    if (!map.has(slug)) {
      map.set(slug, { name, slug, works: [] });
    }

    map.get(slug).works.push(object);
  }

  const artists = [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );

  // Stable ordering of works inside a project (oldest first).
  for (const artist of artists) {
    artist.works.sort((a, b) => (a.year || 0) - (b.year || 0));
  }

  return artists;
}
