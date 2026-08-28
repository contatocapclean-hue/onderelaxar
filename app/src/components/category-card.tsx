import Link from "next/link";
import type { ServiceCategory } from "@/lib/types";

/** Ícone único, vazado (outline), usado para todas as categorias — sem
 * emojis e sem depender de um mapeamento por categoria. */
function CategoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M12 3 L14.2 9.8 L21 12 L14.2 14.2 L12 21 L9.8 14.2 L3 12 L9.8 9.8 Z" />
    </svg>
  );
}

export function CategoryCard({ category, citySlug }: { category: ServiceCategory; citySlug?: string }) {
  const href = citySlug ? `/massagistas/${citySlug}?categoria=${category.slug}` : `/massagistas/salvador-ba?categoria=${category.slug}`;

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-5 text-center card-shadow transition-transform hover:-translate-y-0.5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-primary">
        <CategoryIcon />
      </span>
      <span className="text-sm font-medium text-foreground">{category.name}</span>
    </Link>
  );
}
