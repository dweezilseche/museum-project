"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMuseum } from "@/components/MuseumProvider";
import { isWikimediaThumbnail, getWikimediaThumbnail } from "@/lib/wikimedia";

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Plain image with a blur-up reveal, sized to its natural aspect so the images
// tile at varied heights inside the masonry columns.
function ArchiveImage({ work }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const src = isWikimediaThumbnail(work.image)
    ? getWikimediaThumbnail(work.image, 640)
    : work.image;

  if (errored) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#f4f2ee] p-6 text-center">
        <span className="text-sm italic text-muted">{work.title}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${work.title} — ${work.artist}`}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setErrored(true)}
      className={`w-full transition-[opacity,filter] duration-700 ease-out ${
        loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
      }`}
    />
  );
}

export default function Archive() {
  const { artists, openWork } = useMuseum();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const works = useMemo(
    () =>
      artists.flatMap((artist) =>
        artist.works.map((work) => ({ ...work, artistSlug: artist.slug })),
      ),
    [artists],
  );

  const filtered = useMemo(() => {
    const query = normalize(search);

    if (!query) return works;

    return works.filter((work) => {
      const haystack = [work.title, work.artist, work.movement, work.year]
        .filter(Boolean)
        .map(normalize)
        .join(" ");

      return haystack.includes(query);
    });
  }, [search, works]);

  const open = (work) => {
    openWork(work.artistSlug, work.id);
    router.push("/");
  };

  return (
    <section className="min-h-screen px-6 pb-16 pt-24 md:px-16">
      {/* Discreet search */}
      <div className="mb-10 flex items-baseline justify-between gap-6">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un artiste, une œuvre, un mouvement…"
          className="w-full max-w-md border-0 border-b border-foreground/20 bg-transparent pb-1 text-base outline-none placeholder:text-muted focus:border-foreground"
        />
        <span className="shrink-0 text-muted tabular-nums">
          {filtered.length}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="gap-6 [column-fill:_balance] columns-2 md:columns-3 lg:columns-4">
          {filtered.map((work) => (
            <button
              key={work.id}
              type="button"
              onClick={() => open(work)}
              className="group mb-6 block w-full break-inside-avoid overflow-hidden text-left"
            >
              <ArchiveImage work={work} />
              <span className="mt-2 block text-sm text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {work.artist} — <span className="italic">{work.title}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted">Aucun résultat pour « {search} ».</p>
      )}
    </section>
  );
}
