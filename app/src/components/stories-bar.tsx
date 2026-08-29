"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Story } from "@/lib/types";

const IMAGE_DURATION_MS = 5000;

interface Group {
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  professionalPhoto: string | null;
  stories: Story[];
}

export function StoriesBar({ stories }: { stories: Story[] }) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const s of stories) {
      const existing = map.get(s.professionalId);
      if (existing) {
        existing.stories.push(s);
      } else {
        map.set(s.professionalId, {
          professionalId: s.professionalId,
          professionalName: s.professionalName,
          professionalSlug: s.professionalSlug,
          professionalPhoto: s.professionalPhoto,
          stories: [s],
        });
      }
    }
    return Array.from(map.values());
  }, [stories]);

  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(null);

  if (groups.length === 0) return null;

  return (
    <section className="container-page pb-4 pt-3">
      <div className="flex gap-4 overflow-x-auto pb-1">
        {groups.map((g, i) => {
          // Prévia = o último story publicado (o primeiro do grupo, já que a
          // lista vem ordenada do mais recente para o mais antigo), não a
          // foto de perfil.
          const latest = g.stories[0];
          return (
            <button
              key={g.professionalId}
              onClick={() => setOpenGroupIndex(i)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span className="rounded-full bg-gradient-to-tr from-primary to-accent-soft p-[2.5px]">
                <span className="block rounded-full bg-background p-[2px]">
                  <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-beige-soft">
                    {latest?.mediaType === "video" ? (
                      <video
                        src={latest.mediaUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="h-full w-full object-cover"
                      />
                    ) : latest?.mediaUrl ? (
                      <Image src={latest.mediaUrl} alt="" fill className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg text-foreground/60">
                        {g.professionalName.charAt(0)}
                      </span>
                    )}
                  </span>
                </span>
              </span>
              <span className="max-w-[4.5rem] truncate text-xs text-foreground/80">
                {g.professionalName.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {openGroupIndex !== null && (
        <StoryViewer
          groups={groups}
          initialIndex={openGroupIndex}
          onClose={() => setOpenGroupIndex(null)}
        />
      )}
    </section>
  );
}

function StoryViewer({
  groups,
  initialIndex,
  onClose,
}: {
  groups: Group[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [groupIndex, setGroupIndex] = useState(initialIndex);
  const [storyIndex, setStoryIndex] = useState(0);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  function goNext() {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }

  function goPrev() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(0);
    }
  }

  useEffect(() => {
    if (!story || story.mediaType !== "image") return;
    const timer = setTimeout(goNext, IMAGE_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex]);

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <button onClick={onClose} className="absolute right-4 top-4 text-2xl text-white">
        ×
      </button>

      <div className="relative flex h-full max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-[var(--radius-md)] bg-black">
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
          {group.stories.map((_, i) => (
            <span key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                className={`block h-full bg-white ${i < storyIndex ? "w-full" : i === storyIndex ? "w-full animate-pulse" : "w-0"}`}
              />
            </span>
          ))}
        </div>

        <div className="absolute left-2 top-5 z-10 flex items-center gap-2 text-white">
          <span className="relative block h-7 w-7 overflow-hidden rounded-full bg-white/20">
            {group.professionalPhoto && <Image src={group.professionalPhoto} alt="" fill className="object-cover" />}
          </span>
          {group.professionalSlug ? (
            <Link href={`/perfil/${group.professionalSlug}`} className="text-sm font-medium hover:underline">
              {group.professionalName}
            </Link>
          ) : (
            <span className="text-sm font-medium">{group.professionalName}</span>
          )}
        </div>

        <div className="relative flex-1">
          {story.mediaType === "video" ? (
            <video
              key={story.id}
              src={story.mediaUrl}
              className="h-full w-full object-contain"
              autoPlay
              muted
              playsInline
              onEnded={goNext}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={story.id} src={story.mediaUrl} alt="" className="h-full w-full object-contain" />
          )}
          <button onClick={goPrev} className="absolute left-0 top-0 h-full w-1/3" aria-label="Anterior" />
          <button onClick={goNext} className="absolute right-0 top-0 h-full w-1/3" aria-label="Próximo" />
        </div>
      </div>
    </div>
  );
}
