"use client";

import { useState } from "react";
import { Field } from "@/components/form-fields";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/mock-data";
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

  const [systemStory, setSystemStory] = useState(initialSettings.systemStory);
  const [storyUploading, setStoryUploading] = useState(false);
  const [storyMessage, setStoryMessage] = useState<string | null>(null);

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

  async function handleStoryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setStoryMessage(null);
    if (!isSupabaseConfigured()) {
      setStoryMessage("Modo demonstração: configure o Supabase para publicar de verdade.");
      return;
    }

    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    setStoryUploading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) {
      setStoryUploading(false);
      setStoryMessage("Você precisa estar logado.");
      return;
    }

    const path = `${user.id}/sistema-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase!.storage.from("story-media").upload(path, file);
    if (uploadError) {
      setStoryUploading(false);
      setStoryMessage(uploadError.message);
      return;
    }
    const { data: pub } = supabase!.storage.from("story-media").getPublicUrl(path);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemStoryMediaUrl: pub.publicUrl, systemStoryMediaType: mediaType }),
    });
    const data = await res.json();
    setStoryUploading(false);
    if (!res.ok) {
      setStoryMessage(data.error ?? "Erro ao publicar.");
      return;
    }
    setSystemStory({ mediaUrl: pub.publicUrl, mediaType, updatedAt: new Date().toISOString() });
    setStoryMessage("Story do sistema publicado! Fica fixo no início da barra de stories.");
  }

  async function handleRemoveStory() {
    setStoryMessage(null);
    if (!isSupabaseConfigured()) {
      setStoryMessage("Modo demonstração: configure o Supabase para publicar de verdade.");
      return;
    }
    setStoryUploading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemStoryMediaUrl: null }),
    });
    setStoryUploading(false);
    if (!res.ok) {
      const data = await res.json();
      setStoryMessage(data.error ?? "Erro ao remover.");
      return;
    }
    setSystemStory({ mediaUrl: null, mediaType: null, updatedAt: null });
    setStoryMessage("Story do sistema removido.");
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
        <h2 className="mb-1 font-medium text-foreground">Story do sistema</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Foto ou vídeo fixo que aparece sempre primeiro na barra de stories da home, publicado por você
          (administrador master). Não expira em 24h como os stories dos profissionais — fica até você trocar ou
          remover.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {systemStory.mediaUrl && (
            <div className="relative h-28 w-20 overflow-hidden rounded-[var(--radius-sm)] border border-border">
              {systemStory.mediaType === "video" ? (
                <video src={systemStory.mediaUrl} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={systemStory.mediaUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
              {storyUploading ? "Enviando…" : systemStory.mediaUrl ? "Trocar story" : "Publicar story"}
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={handleStoryFile}
                disabled={storyUploading}
              />
            </label>
            {systemStory.mediaUrl && (
              <button
                onClick={handleRemoveStory}
                disabled={storyUploading}
                className="text-xs text-muted-foreground underline disabled:opacity-60"
              >
                Remover story do sistema
              </button>
            )}
          </div>
        </div>
        {storyMessage && <p className="mt-3 text-sm text-primary">{storyMessage}</p>}
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
