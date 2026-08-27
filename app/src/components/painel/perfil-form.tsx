"use client";

import { useState } from "react";
import { Field } from "@/components/form-fields";
import type { City, ProfessionalProfile } from "@/lib/types";

export function PerfilForm({ profile, cities }: { profile: ProfessionalProfile; cities: City[] }) {
  const [professionalName, setProfessionalName] = useState(profile.professionalName);
  const [description, setDescription] = useState(profile.description);
  const [cityId, setCityId] = useState(profile.city.id);
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/professional-profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalName, description, cityId, neighborhood }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Alterações salvas." : data.error ?? "Erro ao salvar.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <Field label="Nome profissional">
        <input value={professionalName} onChange={(e) => setProfessionalName(e.target.value)} className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cidade">
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="input">
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.state}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bairro/região">
          <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="input" />
        </Field>
      </div>
      <Field label="Descrição">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="input" />
      </Field>
      {message && <p className="text-sm text-primary">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
