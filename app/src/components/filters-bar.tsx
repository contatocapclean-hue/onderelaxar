"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ServiceCategory } from "@/lib/types";

interface Props {
  categories: ServiceCategory[];
}

export function FiltersBar({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const categoria = searchParams.get("categoria") ?? "";
  const atendimento = searchParams.get("atendimento") ?? "";
  const verificado = searchParams.get("verificado") === "1";
  const ordenar = searchParams.get("ordenar") ?? "recent";
  const bairro = searchParams.get("bairro") ?? "";

  const content = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Bairro/região</label>
        <input
          defaultValue={bairro}
          onBlur={(e) => update("bairro", e.target.value || null)}
          placeholder="Ex: Pituba"
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo de massagem</label>
        <select
          value={categoria}
          onChange={(e) => update("categoria", e.target.value || null)}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Forma de atendimento</label>
        <select
          value={atendimento}
          onChange={(e) => update("atendimento", e.target.value || null)}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Qualquer</option>
          <option value="own_place">Espaço próprio</option>
          <option value="client_home">Domicílio</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Ordenar por</label>
        <select
          value={ordenar}
          onChange={(e) => update("ordenar", e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="recent">Mais recentes</option>
          <option value="most_viewed">Mais visualizados</option>
          <option value="featured">Em destaque</option>
        </select>
      </div>

      <div className="flex items-end pb-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={verificado}
            onChange={(e) => update("verificado", e.target.checked ? "1" : null)}
            className="h-4 w-4 rounded border-border accent-[var(--color-primary)]"
          />
          Apenas verificados
        </label>
      </div>
    </div>
  );

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 card-shadow">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium text-foreground lg:hidden"
      >
        Filtros
        <span>{open ? "−" : "+"}</span>
      </button>
      <div className={`${open ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}>{content}</div>
    </div>
  );
}
