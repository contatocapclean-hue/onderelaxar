"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Fallback de erro para a página de perfil — antes, se a consulta ao
 * Supabase falhasse aqui (a rota de maior tráfego do site), o visitante via
 * a tela de erro genérica do Next em vez de uma mensagem no estilo do site
 * com a chance de tentar de novo. */
export default function PerfilError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-2xl text-foreground">Não foi possível carregar este perfil</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Pode ter sido uma instabilidade momentânea. Tente novamente em alguns segundos.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Tentar novamente
        </button>
        <Link href="/" className="text-sm text-muted-foreground underline hover:text-primary">
          Voltar para a home
        </Link>
      </div>
    </div>
  );
}
