import Link from "next/link";
import type { ServiceCategory } from "@/lib/types";

const ICONS: Record<string, string> = {
  sparkles: "✨",
  "heart-pulse": "💆",
  dumbbell: "🏋️",
  droplet: "💧",
  wand: "🪄",
  hand: "🖐️",
  footprints: "👣",
  leaf: "🌿",
  flame: "🔥",
  plus: "➕",
};

export function CategoryCard({ category, citySlug }: { category: ServiceCategory; citySlug?: string }) {
  const href = citySlug ? `/massagistas/${citySlug}?categoria=${category.slug}` : `/massagistas/salvador-ba?categoria=${category.slug}`;

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-5 text-center card-shadow transition-transform hover:-translate-y-0.5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-2xl">
        {ICONS[category.icon ?? ""] ?? "💆"}
      </span>
      <span className="text-sm font-medium text-foreground">{category.name}</span>
    </Link>
  );
}
