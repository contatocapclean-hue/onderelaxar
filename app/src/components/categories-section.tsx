"use client";

import { useState } from "react";
import { CategoryCard } from "@/components/category-card";
import type { ServiceCategory } from "@/lib/types";

// 2 linhas de 4 no desktop (md+) e 2 linhas de 2 no mobile = 8 categorias visíveis por padrão.
const COLLAPSED_COUNT = 8;

export function CategoriesSection({ categories }: { categories: ServiceCategory[] }) {
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) return null;

  const visible = expanded ? categories : categories.slice(0, COLLAPSED_COUNT);
  const hasMore = categories.length > COLLAPSED_COUNT;

  return (
    <section id="categorias" className="container-page py-16 sm:py-20">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">Categorias</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {visible.map((c) => (
          <CategoryCard key={c.slug} category={c} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-beige-soft"
          >
            {expanded ? "Ver menos" : `Ver mais (${categories.length - COLLAPSED_COUNT})`}
          </button>
        </div>
      )}
    </section>
  );
}
