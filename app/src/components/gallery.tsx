"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo } from "@/lib/types";

export function Gallery({ mainPhoto, photos, name }: { mainPhoto: string | null; photos: Photo[]; name: string }) {
  const all = [
    ...(mainPhoto ? [{ id: "main", url: mainPhoto, kind: "profile" as const, order: -1 }] : []),
    ...photos,
  ];
  const [active, setActive] = useState(0);

  if (all.length === 0) {
    return <div className="aspect-[4/3] w-full rounded-[var(--radius-lg)] bg-beige-soft" />;
  }

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-beige-soft">
        <Image src={all[active].url} alt={name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
      </div>
      {all.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {all.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors ${
                i === active ? "border-primary" : "border-transparent"
              }`}
            >
              <Image src={photo.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
