import Link from "next/link";

/** Atalho no cabeçalho para a profissional publicar um story rapidamente,
 * sem precisar navegar pelo menu do painel até achar a opção. Leva direto
 * para a aba "Dados" de Meu perfil, onde fica o bloco "Destaque e Stories".
 * Ícone inspirado num "adicionar story" (anel quebrado + "+"), na cor
 * verde musgo da paleta do site (--color-primary). */
export function AddStoryButton() {
  return (
    <Link
      href="/painel/perfil?tab=dados"
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
    </Link>
  );
}
