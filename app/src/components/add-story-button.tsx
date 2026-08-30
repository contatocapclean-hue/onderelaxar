"use client";

import { StoryPublishModal } from "@/components/story-publish-modal";

/** Atalho no cabeçalho para a profissional publicar um story rapidamente,
 * sem precisar navegar pelo menu do painel até achar a opção. Abre o modal
 * de upload direto (com prévia antes de publicar), em vez de só levar até a
 * aba "Dados" de Meu perfil. Ícone inspirado num "adicionar story" (anel
 * quebrado + "+"), na cor verde musgo da paleta do site (--color-primary).
 */
export function AddStoryButton({
  professionalId,
  walletBalanceCents,
  storyPriceCents,
  demo,
}: {
  professionalId: string;
  walletBalanceCents: number;
  storyPriceCents: number;
  demo: boolean;
}) {
  return (
    <StoryPublishModal
      professionalId={professionalId}
      walletBalanceCents={walletBalanceCents}
      storyPriceCents={storyPriceCents}
      demo={demo}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label="Publicar story"
          title="Publicar story"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent-soft"
        >
          <svg viewBox="0 0 48 48" fill="none" className="h-7 w-7" aria-hidden="true">
            <circle
              cx="24"
              cy="24"
              r="19"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeDasharray="11 6 24 6 11 6"
            />
            <path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
    />
  );
}
