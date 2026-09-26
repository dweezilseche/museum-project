import { notFound } from "next/navigation";

import { getArtists } from "@/lib/museum";
import { absoluteUrl } from "@/lib/site";
import ArtworkPageClient from "@/components/ArtworkPageClient";

async function findWork(slug) {
  const artists = await getArtists();
  return artists.flatMap((artist) => artist.works).find((w) => w.slug === slug);
}

// Prerender every artwork page at build time so each has a static, crawlable URL.
export async function generateStaticParams() {
  try {
    const artists = await getArtists();
    return artists
      .flatMap((artist) => artist.works)
      .map((work) => ({ slug: work.slug }));
  } catch {
    return [];
  }
}

// Turn the API's HTML description into a plain-text excerpt for meta tags.
function excerpt(html = "", max = 160) {
  const text = String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const work = await findWork(slug);

  if (!work) {
    return { title: "Work not found", robots: { index: false } };
  }

  const title = `${work.title} — ${work.artist}`;
  const description =
    excerpt(work.description) ||
    `${work.title} by ${work.artist}${work.year ? `, ${work.year}` : ""}.`;
  const path = `/work/${work.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description,
      url: path,
      images: work.image
        ? [{ url: work.image, alt: work.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: work.image ? [work.image] : undefined,
    },
  };
}

export default async function WorkPage({ params }) {
  const { slug } = await params;
  const work = await findWork(slug);

  if (!work) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: work.title,
    url: absoluteUrl(`/work/${work.slug}`),
    image: work.image || undefined,
    creator: { "@type": "Person", name: work.artist },
    dateCreated: work.year ? String(work.year) : undefined,
    artform: work.type || undefined,
    artMovement: work.movement || undefined,
    locationCreated: work.location
      ? { "@type": "Place", name: work.location }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtworkPageClient work={work} />
    </>
  );
}
