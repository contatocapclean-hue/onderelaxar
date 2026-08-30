"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Modal de publicar story: escolher arquivo → ver uma prévia → confirmar.
 * Antes o upload acontecia assim que o arquivo era escolhido, sem chance de
 * conferir antes de publicar (e cobrar da carteira). Usado tanto no atalho
 * do cabeçalho quanto no bloco "Destaque e Stories" da aba Dados — o botão
 * que abre o modal (`trigger`) é o único ponto que muda entre os dois. */
export function StoryPublishModal({
  professionalId,
  walletBalanceCents,
  storyPriceCents,
  demo,
  trigger,
  onPublished,
}: {
  professionalId: string;
  walletBalanceCents: number;
  storyPriceCents: number;
  demo: boolean;
  trigger: (open: () => void) => React.ReactNode;
  onPublished?: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canAfford = demo || walletBalanceCents >= storyPriceCents;

  function resetSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setMediaType(null);
  }

  function open() {
    setMessage(null);
    setIsOpen(true);
  }

  function close() {
    if (uploading) return;
    resetSelection();
    setMessage(null);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, uploading]);

  function handleSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    setMessage(null);
    resetSelection();
    setFile(selected);
    setMediaType(selected.type.startsWith("video/") ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handlePublish() {
    if (!file || !mediaType) return;
    setMessage(null);

    if (demo) {
      setMessage("Modo demonstração: alterações não são persistidas.");
      return;
    }
    if (!canAfford) {
      setMessage("Saldo insuficiente. Faça um depósito antes de publicar um story.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) {
      setUploading(false);
      setMessage("Você precisa estar logado.");
      return;
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase!.storage.from("story-media").upload(path, file);
    if (uploadError) {
      setUploading(false);
      setMessage(uploadError.message);
      return;
    }
    const { data: pub } = supabase!.storage.from("story-media").getPublicUrl(path);

    const { error: rpcError } = await supabase!.rpc("purchase_story", {
      p_professional_id: professionalId,
      p_media_url: pub.publicUrl,
      p_media_type: mediaType,
    });
    setUploading(false);

    if (rpcError) {
      setMessage(rpcError.message);
      return;
    }

    resetSelection();
    setIsOpen(false);
    router.refresh();
    onPublished?.();
  }

  return (
    <>
      {trigger(open)}

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={close}
          >
          <div
            className="w-full max-w-sm rounded-[var(--radius-lg)] bg-surface p-6 card-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="font-display text-lg text-foreground">Publicar story</p>
              <button
                type="button"
                onClick={close}
                disabled={uploading}
                aria-label="Fechar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-foreground/70 hover:bg-beige-soft disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              {formatCents(storyPriceCents)} por story — foto ou vídeo curto, fica visível por 24 horas na home.
            </p>

            {!canAfford && (
              <p className="mb-4 text-sm text-amber-700">
                Saldo insuficiente — deposite na Carteira antes de publicar.
              </p>
            )}

            {!previewUrl ? (
              <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border text-sm text-muted-foreground hover:bg-beige-soft">
                <span aria-hidden className="text-2xl leading-none">
                  +
                </span>
                Escolher foto ou vídeo
                <input type="file" accept="image/*,video/*" hidden onChange={handleSelectFile} />
              </label>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-72 w-40 overflow-hidden rounded-[var(--radius-md)] bg-black">
                  {mediaType === "video" ? (
                    <video src={previewUrl} className="h-full w-full object-contain" controls muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Prévia do story" className="h-full w-full object-contain" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Prévia — assim seu story vai aparecer.</p>
              </div>
            )}

            {message && <p className="mt-4 text-sm text-foreground/80">{message}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              {previewUrl ? (
                <>
                  <button
                    type="button"
                    onClick={resetSelection}
                    disabled={uploading}
                    className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft disabled:opacity-60"
                  >
                    Trocar arquivo
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={uploading || (!canAfford && !demo)}
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                  >
                    {uploading ? "Publicando…" : "Publicar"}
                  </button>
                </>
              ) : (
                <button type="button" onClick={close} className="text-sm text-muted-foreground underline">
                  Cancelar
                </button>
              )}
            </div>
          </div>
          </div>,
          document.body
        )}
    </>
  );
}
