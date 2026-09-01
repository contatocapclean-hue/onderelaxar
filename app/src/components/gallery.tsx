"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Photo } from "@/lib/types";
import { BLUR_DATA_URL } from "@/lib/utils";

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

  // Cada foto aparece na vertical (proporção 2:3, próxima do enquadramento
  // que as profissionais já enviam), organizadas em grade de até 2 colunas
  // — não tem mais uma "foto principal" grande e recortada na horizontal
  // com uma fileira de miniaturas embaixo, que escondia a maior parte da
  // foto até clicar em "Ampliar". Com 1 foto só, ela fica centralizada em
  // vez de esticada; com 2 ou mais, ficam lado a lado, no máximo 2 por
  // linha. object-cover recorta o quadro, mas o quadro em si já é vertical,
  // então sobra bem menos foto de fora do que antes.
  const itemClass =
    "group relative aspect-[2/3] max-h-[620px] w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-lg)] bg-beige-soft";

  if (all.length === 0) {
    return <div className={`${itemClass} mx-auto max-w-sm`} />;
  }

  function openAt(i: number) {
    setActive(i);
    setLightboxOpen(true);
  }

  return (
    <div>
      <div className={all.length === 1 ? "mx-auto max-w-sm" : "grid grid-cols-2 gap-2"}>
        {all.map((photo, i) => (
          <button key={photo.id} type="button" onClick={() => openAt(i)} className={itemClass} aria-label="Ampliar foto">
            <Image
              src={photo.url}
              alt={name}
              fill
              sizes="(max-width: 640px) 46vw, 380px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              priority={i < 2}
            />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Ampliar
            </span>
          </button>
        ))}
      </div>

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
      {/* Botão de fechar maior e com fundo, mais fácil de acertar. Clicar na
       * própria foto (não só no fundo) também fecha — antes só o fundo em
       * volta da imagem fechava, e em fotos grandes sobrava pouco espaço
       * "de fora" para clicar, dificultando fechar. */}
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-2xl leading-none text-white hover:bg-black/80 sm:right-4 sm:top-4"
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

      <div className="relative h-full max-h-[85vh] w-full max-w-4xl" onClick={onClose}>
        <Image
          src={photos[active].url}
          alt={name}
          fill
          sizes="100vw"
          className="object-contain"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
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
