"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Fallback de erro para a listagem por cidade — mesma ideia do error.tsx
 * de perfil: essa rota também recebe bastante tráfego direto (busca do
 * Google, links do footer) e antes não tinha nenhum fallback próprio se a
 * consulta ao Supabase falhasse. */
export default function CidadeError({
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
      <p className="font-display text-2xl text-foreground">Não foi possível carregar esta lista de profissionais</p>
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
