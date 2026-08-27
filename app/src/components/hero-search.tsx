"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { slugify } from "@/lib/utils";
import type { City } from "@/lib/types";

export function HeroSearch({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? "");
  const [neighborhood, setNeighborhood] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (neighborhood.trim()) params.set("bairro", slugify(neighborhood.trim()));
    const query = params.toString();
    router.push(`/massagistas/${citySlug}${query ? `?${query}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3 card-shadow sm:flex-row sm:items-center"
    >
      <div className="flex-1">
        <label className="block px-2 text-xs font-medium text-muted-foreground">Cidade</label>
        <select
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] bg-transparent px-2 py-1.5 text-sm text-foreground outline-none"
        >
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} — {c.state}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden h-10 w-px bg-border sm:block" />
      <div className="flex-1">
        <label className="block px-2 text-xs font-medium text-muted-foreground">
          Bairro/região (opcional)
        </label>
        <input
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          placeholder="Ex: Pituba"
          className="w-full rounded-[var(--radius-sm)] bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-[var(--radius-md)] bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Buscar
      </button>
    </form>
  );
}
