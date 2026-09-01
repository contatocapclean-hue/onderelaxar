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

  // Proporção 4:5 (retrato) em qualquer tamanho de tela — as fotos enviadas
  // pelas profissionais já são verticais, e recortá-las na horizontal
  // (como era antes na versão web) escondia a maior parte da foto até
  // clicar em "Ampliar". Só limitamos a altura máxima: em telas largas a
  // coluna do perfil chega a 768px, e manter 4:5 sem limite deixaria a
  // foto enorme (~960px de altura). Com o limite, o quadro fica vertical
  // no celular e um pouco mais recortado nas laterais no desktop, mas
  // nunca passa de 560px de altura. object-cover continua recortando a
  // foto para preencher o quadro dos dois jeitos.
  const mainBoxClass = "aspect-[4/5] max-h-[560px]";

  if (all.length === 0) {
    return <div className={`${mainBoxClass} w-full rounded-[var(--radius-lg)] bg-beige-soft`} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className={`group relative block ${mainBoxClass} w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-lg)] bg-beige-soft`}
        aria-label="Ampliar foto"
      >
        {/* Prévia recortada para preencher todo o quadro, mesmo em fotos
         * verticais. Ao clicar, o lightbox abaixo mostra a foto inteira. */}
        <Image
          src={all[active].url}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
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
              <Image
                src={photo.url}
                alt=""
                fill
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                quality={60}
                sizes="64px"
                className="object-cover"
              />
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
