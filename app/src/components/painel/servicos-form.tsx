"use client";

import { useState } from "react";
import type { ProfessionalProfile, ServiceCategory } from "@/lib/types";

export function ServicosForm({ profile, categories }: { profile: ProfessionalProfile; categories: ServiceCategory[] }) {
  const [selected, setSelected] = useState<string[]>(profile.categories.map((c) => c.id));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/professional-profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: selected }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Serviços atualizados." : data.error ?? "Erro ao salvar.");
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <p className="mb-4 text-sm text-muted-foreground">Selecione os tipos de massagem que você oferece.</p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selected.includes(c.id)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-beige-soft"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {message && <p className="mt-4 text-sm text-primary">{message}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar serviços"}
      </button>
    </div>
  );
}
