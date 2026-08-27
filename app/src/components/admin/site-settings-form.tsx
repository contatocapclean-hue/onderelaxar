"use client";

import { useState } from "react";
import { Field } from "@/components/form-fields";
import type { SiteSettings } from "@/lib/types";

export function SiteSettingsForm({ initialSettings }: { initialSettings: SiteSettings }) {
  const [heroBadge, setHeroBadge] = useState(initialSettings.heroBadge);
  const [heroTitle, setHeroTitle] = useState(initialSettings.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialSettings.heroSubtitle);
  const [ctaTitle, setCtaTitle] = useState(initialSettings.ctaTitle);
  const [ctaSubtitle, setCtaSubtitle] = useState(initialSettings.ctaSubtitle);
  const [footerDescription, setFooterDescription] = useState(initialSettings.footerDescription);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroBadge, heroTitle, heroSubtitle, ctaTitle, ctaSubtitle, footerDescription }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Alterações salvas — já valem para o site." : data.error ?? "Erro ao salvar.");
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <h2 className="mb-1 font-medium text-foreground">Página inicial — destaque no topo</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          O selinho, o título e o subtítulo mostrados logo abaixo do cabeçalho.
        </p>
        <div className="flex flex-col gap-4">
          <Field label="Selo (acima do título)">
            <input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} className="input" />
          </Field>
          <Field label="Título principal">
            <textarea value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} rows={2} className="input" />
          </Field>
          <Field label="Subtítulo">
            <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} className="input" />
          </Field>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <h2 className="mb-1 font-medium text-foreground">Página inicial — chamada final</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          O bloco de convite para profissionais, perto do rodapé da home.
        </p>
        <div className="flex flex-col gap-4">
          <Field label="Título da chamada">
            <textarea value={ctaTitle} onChange={(e) => setCtaTitle(e.target.value)} rows={2} className="input" />
          </Field>
          <Field label="Texto de apoio">
            <textarea value={ctaSubtitle} onChange={(e) => setCtaSubtitle(e.target.value)} rows={2} className="input" />
          </Field>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <h2 className="mb-1 font-medium text-foreground">Rodapé</h2>
        <p className="mb-4 text-sm text-muted-foreground">Texto curto abaixo da logo, em todas as páginas.</p>
        <Field label="Descrição do rodapé">
          <textarea
            value={footerDescription}
            onChange={(e) => setFooterDescription(e.target.value)}
            rows={2}
            className="input"
          />
        </Field>
      </section>

      {message && <p className="text-sm text-primary">{message}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar alterações"}
      </button>
    </div>
  );
}
