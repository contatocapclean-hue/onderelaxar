"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Photo } from "@/lib/types";

export function Gallery({ mainPhoto, photos, name }: { mainPhoto: string | null; photos: Photo[]; name: string }) {
  // mainPhoto (a foto de perfil) é sempre a URL de uma das fotos já
  // presentes em `photos` — não é uma imagem à parte. Deduplicamos por
  // URL para não mostrar a mesma foto duas vezes na galeria.
  const candidates = [
    ...(mainPhoto ? [{ id: "main", url: mainPhoto, kind: "profile" as const, order: -1 }] : []),
    ...photos,
  ];
  const seenUrls = new Set<string>();
  const all = candidates.filter((p) => {
    if (seenUrls.has(p.url)) return false;
    seenUrls.add(p.url);
    return true;
  });
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (all.length === 0) {
    return <div className="aspect-[4/3] w-full rounded-[var(--radius-lg)] bg-beige-soft" />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-lg)] bg-beige-soft"
        aria-label="Ampliar foto"
      >
        {/* Camada de fundo, desfocada, para preencher o quadro sem cortar a foto */}
        <Image
          src={all[active].url}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="scale-110 object-cover blur-2xl opacity-50"
          aria-hidden
        />
        {/* Foto real, sempre inteira (sem corte) */}
        <Image
          src={all[active].url}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          priority
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          Ampliar
        </span>
      </button>
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

      {lightboxOpen && (
        <Lightbox
          photos={all}
          name={name}
          active={active}
          setActive={setActive}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

function Lightbox({
  photos,
  name,
  active,
  setActive,
  onClose,
}: {
  photos: { id: string; url: string }[];
  name: string;
  active: number;
  setActive: (i: number) => void;
  onClose: () => void;
}) {
  function goNext() {
    setActive((active + 1) % photos.length);
  }
  function goPrev() {
    setActive((active - 1 + photos.length) % photos.length);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-3xl text-white/90 hover:text-white"
        aria-label="Fechar"
      >
        ×
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-xl text-white hover:bg-black/60 sm:left-6"
          aria-label="Anterior"
        >
          ‹
        </button>
      )}

      <div
        className="relative h-full max-h-[85vh] w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={photos[active].url} alt={name} fill sizes="100vw" className="object-contain" />
      </div>

      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-xl text-white hover:bg-black/60 sm:right-6"
          aria-label="Próxima"
        >
          ›
        </button>
      )}
    </div>
  );
}
