"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/mock-data";
import type { ProfessionalProfile, Story, WalletPricing, WalletTransaction } from "@/lib/types";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TRANSACTION_LABEL: Record<string, string> = {
  deposit: "Depósito via Pix",
  featured_purchase: "Destaque do perfil",
  story_purchase: "Story publicado",
  refund: "Estorno",
};

const DEPOSIT_PRESETS_CENTS = [2000, 5000, 10000];

const PENDING_POLL_INTERVAL_MS = 4000;
const PENDING_POLL_TIMEOUT_MS = 3 * 60 * 1000;

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

export function CarteiraForm({
  profile,
  pricing,
  transactions,
  stories,
}: {
  profile: ProfessionalProfile;
  pricing: WalletPricing;
  transactions: WalletTransaction[];
  stories: Story[];
}) {
  const router = useRouter();
  const demo = !isSupabaseConfigured();

  // ---------------------------------------------------------------------
  // Depósito via Pix
  // ---------------------------------------------------------------------
  const [depositAmount, setDepositAmount] = useState(2000);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ depositId: string; qrCode: string | null; qrCodeBase64: string | null } | null>(
    null
  );
  const [depositStatus, setDepositStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleGeneratePix() {
    setDepositError(null);
    if (demo) {
      setDepositError("Modo demonstração: configure o Supabase e o Mercado Pago para depositar de verdade.");
      return;
    }
    setDepositLoading(true);
    const res = await fetch("/api/wallet/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: depositAmount }),
    });
    const data = await res.json();
    setDepositLoading(false);
    if (!res.ok) {
      setDepositError(data.error ?? "Erro ao gerar cobrança Pix.");
      return;
    }
    setPix({ depositId: data.depositId, qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
    setDepositStatus("pending");
  }

  useEffect(() => {
    if (!pix || depositStatus !== "pending") return;

    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > PENDING_POLL_TIMEOUT_MS) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      const res = await fetch(`/api/wallet/deposits/${pix.depositId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "approved") {
        setDepositStatus("approved");
        if (pollRef.current) clearInterval(pollRef.current);
        router.refresh();
      } else if (data.status === "rejected") {
        setDepositStatus("rejected");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, PENDING_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix, depositStatus]);

  async function handleCopy() {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

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
    <div className="flex flex-col gap-6">
      {demo && (
        <div className="rounded-[var(--radius-md)] bg-primary/5 p-3 text-xs text-primary">
          Modo demonstração — configure o Supabase e o Mercado Pago para usar a carteira de verdade.
        </div>
      )}

      {/* Saldo */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <p className="text-sm text-muted-foreground">Saldo disponível</p>
        <p className="font-display mt-1 text-3xl text-foreground">{formatCents(profile.walletBalanceCents)}</p>
      </div>

      {/* Depositar */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <p className="mb-4 font-medium text-foreground">Depositar via Pix</p>

        {!pix && (
          <>
            <div className="flex flex-wrap gap-2">
              {DEPOSIT_PRESETS_CENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDepositAmount(c)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    depositAmount === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-beige-soft"
                  }`}
                >
                  {formatCents(c)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Outro valor:</span>
              <input
                type="number"
                min={5}
                step="0.01"
                value={(depositAmount / 100).toFixed(2)}
                onChange={(e) => setDepositAmount(Math.round(Number(e.target.value) * 100))}
                className="w-28 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm"
              />
            </div>
            {depositError && <p className="mt-3 text-sm text-red-600">{depositError}</p>}
            <button
              onClick={handleGeneratePix}
              disabled={depositLoading}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {depositLoading ? "Gerando cobrança…" : "Gerar Pix"}
            </button>
          </>
        )}

        {pix && depositStatus === "pending" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR code ou copie o código Pix para pagar {formatCents(depositAmount)}.
            </p>
            {pix.qrCodeBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR code Pix"
                className="h-56 w-56 rounded-[var(--radius-md)] border border-border"
              />
            )}
            {pix.qrCode && (
              <button
                onClick={handleCopy}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft"
              >
                {copied ? "Copiado!" : "Copiar código Pix"}
              </button>
            )}
            <p className="text-xs text-muted-foreground">Aguardando confirmação do pagamento…</p>
            <button
              onClick={() => {
                setPix(null);
                setDepositStatus(null);
              }}
              className="text-xs text-muted-foreground underline"
            >
              Cancelar e voltar
            </button>
          </div>
        )}

        {depositStatus === "approved" && (
          <div className="text-center">
            <p className="text-sm font-medium text-green-700">Pagamento confirmado! Saldo atualizado.</p>
            <button
              onClick={() => {
                setPix(null);
                setDepositStatus(null);
              }}
              className="mt-3 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft"
            >
              Fazer novo depósito
            </button>
          </div>
        )}

        {depositStatus === "rejected" && (
          <div className="text-center">
            <p className="text-sm text-red-600">Pagamento não aprovado. Tente novamente.</p>
            <button
              onClick={() => {
                setPix(null);
                setDepositStatus(null);
              }}
              className="mt-3 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft"
            >
              Tentar de novo
            </button>
          </div>
        )}
      </div>

      {/* Destacar perfil */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
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
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <p className="mb-1 font-medium text-foreground">Stories</p>
        <p className="mb-4 text-sm text-muted-foreground">
          {formatCents(pricing.storyPriceCents)} por story — foto ou vídeo curto, fica visível por 24 horas na home.
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

      {/* Histórico */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <p className="mb-4 font-medium text-foreground">Histórico</p>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-foreground">{TRANSACTION_LABEL[t.type] ?? t.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={t.amountCents >= 0 ? "font-medium text-green-700" : "font-medium text-foreground/80"}>
                  {t.amountCents >= 0 ? "+" : ""}
                  {formatCents(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
