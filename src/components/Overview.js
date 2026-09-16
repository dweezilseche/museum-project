"use client";

import { useRouter } from "next/navigation";
import { useMuseum } from "@/components/MuseumProvider";
import Media from "@/components/Media";

export default function Overview() {
  const { artist, works, goToImage } = useMuseum();
  const router = useRouter();

  const open = (index) => {
    goToImage(index);
    router.push("/");
  };

  if (!artist) return null;

  return (
    <section className="min-h-screen px-6 pb-16 pt-28 md:px-16">
      <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
        {works.map((work, index) => (
          <figure key={work.id} className="flex flex-col">
            <button
              type="button"
              onClick={() => open(index)}
              className="relative aspect-[4/3] w-full overflow-hidden bg-[#f4f2ee]"
            >
              <Media
                src={work.image}
                alt={`${work.title} — ${artist.name}`}
                fit="contain"
                sizes="(max-width: 768px) 90vw, 44vw"
              />
            </button>

            <figcaption className="mt-3 text-center text-muted">
              {index === 0 ? (
                <span className="text-foreground">{artist.name}</span>
              ) : (
                <span className="tabular-nums">{index + 1}</span>
              )}
              <span className="mx-2">·</span>
              <span className="italic">{work.title}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
