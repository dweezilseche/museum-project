import { getArtists } from "@/lib/museum";
import { absoluteUrl } from "@/lib/site";

// Programmatic sitemap: the static entry points plus one URL per artwork.
export default async function sitemap() {
  const now = new Date();

  const staticEntries = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/gallery"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/tickets"), changeFrequency: "monthly", priority: 0.6 },
  ];

  let workEntries = [];
  try {
    const artists = await getArtists();
    workEntries = artists
      .flatMap((artist) => artist.works)
      .map((work) => ({
        url: absoluteUrl(`/work/${work.slug}`),
        changeFrequency: "yearly",
        priority: 0.7,
        images: work.image ? [work.image] : undefined,
      }));
  } catch {
    // If the collection API is unreachable at build time, still emit the
    // static entries rather than failing the whole sitemap.
  }

  return [...staticEntries, ...workEntries].map((entry) => ({
    lastModified: now,
    ...entry,
  }));
}
