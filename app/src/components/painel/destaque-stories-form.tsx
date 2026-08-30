"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/mock-data";
import type { ProfessionalProfile, Story, WalletPricing } from "@/lib/types";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isFuture(dateIso: string | null): boolean {
  if (!dateIso) return false;
  return new Date(dateIso).getTime() > Date.now();
}

function timeUntil(dateIso: string): string {
  const diffMs = new Date(dateIso).getTime() - Date.now();
  if (diffMs <= 0) return "expirado";
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours >= 1) return `expira em ${hours}h`;
  return `expira em ${minutes}min`;
}

/** Bloco de "Destacar meu perfil" e "Stories", separado dos campos de dados
 * do perfil — antes ficava escondido dentro da aba Carteira, agora aparece
 * logo na aba Dados (onde a profissional já está) para ganhar visibilidade.
 * O saldo em si e o depósito via Pix continuam na Carteira. */
export function DestaqueStoriesForm({
  profile,
  pricing,
  stories,
}: {
  profile: ProfessionalProfile;
  pricing: WalletPricing;
  stories: Story[];
}) {
  const router = useRouter();
  const demo = !isSupabaseConfigured();

  // ---------------------------------------------------------------------
  // Destacar perfil
  // ---------------------------------------------------------------------
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [featuredMessage, setFeaturedMessage] = useState<string | null>(null);
  const isFeaturedActive = isFuture(profile.featuredUntil);
  const canAffordFeatured = profile.walletBalanceCents >= pricing.featuredPriceCents;

  async function handleActivateFeatured() {
    setFeaturedMessage(null);
    if (demo) {
      setFeaturedMessage("Modo demonstração: alterações não são persistidas.");
      return;
    }
    setFeaturedLoading(true);
    const supabase = createClient();
    const { error } = await supabase!.rpc("purchase_featured", { p_professional_id: profile.id });
    setFeaturedLoading(false);
    if (error) {
      setFeaturedMessage(error.message);
      return;
    }
    setFeaturedMessage("Destaque ativado com sucesso!");
    router.refresh();
  }

  // ---------------------------------------------------------------------
  // Stories
  // ---------------------------------------------------------------------
  const [storyUploading, setStoryUploading] = useState(false);
  const [storyMessage, setStoryMessage] = useState<string | null>(null);
  const canAffordStory = profile.walletBalanceCents >= pricing.storyPriceCents;

  async function handleStoryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setStoryMessage(null);

    if (demo) {
      setStoryMessage("Modo demonstração: alterações não são persistidas.");
      return;
    }
    if (!canAffordStory) {
      setStoryMessage("Saldo insuficiente. Faça um depósito antes de publicar um story.");
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

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase!.storage.from("story-media").upload(path, file);
    if (uploadError) {
      setStoryUploading(false);
      setStoryMessage(uploadError.message);
      return;
    }
    const { data: pub } = supabase!.storage.from("story-media").getPublicUrl(path);

    const { error: rpcError } = await supabase!.rpc("purchase_story", {
      p_professional_id: profile.id,
      p_media_url: pub.publicUrl,
      p_media_type: mediaType,
    });
    setStoryUploading(false);

    if (rpcError) {
      setStoryMessage(rpcError.message);
      return;
    }

    setStoryMessage("Story publicado! Ele fica visível por 24 horas.");
    router.refresh();
  }

  async function handleDeleteStory(id: string) {
    if (demo) return;
    const supabase = createClient();
    await supabase!.from("stories").delete().eq("id", id);
    router.refresh();
  }

  const activeStories = stories.filter((s) => isFuture(s.expiresAt));

  return (
    <div className="mb-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg text-foreground">Destaque e Stories</p>
          <p className="text-sm text-muted-foreground">
            Saldo disponível: <span className="font-medium text-foreground">{formatCents(profile.walletBalanceCents)}</span>
            {" · "}
            <Link href="/painel/carteira" className="underline hover:text-primary">
              depositar na Carteira
            </Link>
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Destacar perfil */}
        <div className="rounded-[var(--radius-md)] border border-border p-4">
          <p className="mb-1 font-medium text-foreground">Destacar meu perfil</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {formatCents(pricing.featuredPriceCents)} por {pricing.featuredDays} dias — aparece antes dos demais na
            home e nas listas de cidade.
          </p>
          {isFeaturedActive && profile.featuredUntil && (
            <p className="mb-3 text-sm text-primary">
              Destaque ativo até {new Date(profile.featuredUntil).toLocaleDateString("pt-BR")}.
            </p>
          )}
          {!canAffordFeatured && (
            <p className="mb-3 text-sm text-amber-700">Saldo insuficiente — deposite antes de ativar.</p>
          )}
          {featuredMessage && <p className="mb-3 text-sm text-foreground/80">{featuredMessage}</p>}
          <button
            onClick={handleActivateFeatured}
            disabled={featuredLoading || (!canAffordFeatured && !demo)}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {featuredLoading
              ? "Ativando…"
              : isFeaturedActive
                ? `Renovar por mais ${pricing.featuredDays} dias`
                : "Ativar destaque"}
          </button>
        </div>

        {/* Stories */}
        <div className="rounded-[var(--radius-md)] border border-border p-4">
          <p className="mb-1 font-medium text-foreground">Stories</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {formatCents(pricing.storyPriceCents)} por story — foto ou vídeo curto, fica visível por 24 horas na
            home.
          </p>
          {!canAffordStory && (
            <p className="mb-3 text-sm text-amber-700">Saldo insuficiente — deposite antes de publicar.</p>
          )}
          {storyMessage && <p className="mb-3 text-sm text-foreground/80">{storyMessage}</p>}

          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            {storyUploading ? "Enviando…" : "+ Publicar story"}
            <input type="file" accept="image/*,video/*" hidden onChange={handleStoryFile} disabled={storyUploading} />
          </label>

          {activeStories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {activeStories.map((s) => (
                <div key={s.id} className="relative h-28 w-20 overflow-hidden rounded-[var(--radius-sm)] border border-border">
                  {s.mediaType === "video" ? (
                    <video src={s.mediaUrl} className="h-full w-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.mediaUrl} alt="" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] text-white">
                    {timeUntil(s.expiresAt)}
                  </span>
                  <button
                    onClick={() => handleDeleteStory(s.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
