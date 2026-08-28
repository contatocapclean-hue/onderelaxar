"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  {
    value: "anunciante" as const,
    title: "Sou Anunciante",
    description:
      "Quero divulgar meus serviços de massagem e aparecer para clientes na minha cidade.",
  },
  {
    value: "visitante" as const,
    title: "Sou Visitante",
    description:
      "Quero apenas navegar e encontrar profissionais — sem criar um perfil profissional.",
  },
];

export default function CadastroObjetivoPage() {
  const router = useRouter();
  const [loadingValue, setLoadingValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChoose(value: "anunciante" | "visitante") {
    setError(null);
    setLoadingValue(value);

    const res = await fetch("/api/auth/account-type", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountType: value }),
    });

    if (!res.ok) {
      const data = await res.json();
      setLoadingValue(null);
      setError(data.error ?? "Não foi possível salvar sua escolha.");
      return;
    }

    if (value === "anunciante") {
      router.push("/cadastro/perfil");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-2xl rounded-[var(--radius-lg)] border border-border bg-surface p-8 card-shadow">
        <h1 className="font-display text-2xl text-foreground">Qual é o seu objetivo?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Passo 2 — isso define o que você vai ver a seguir.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChoose(opt.value)}
              disabled={loadingValue !== null}
              className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-border p-5 text-left transition-colors hover:border-primary hover:bg-beige-soft disabled:opacity-60"
            >
              <span className="font-display text-lg text-foreground">{opt.title}</span>
              <span className="text-sm text-muted-foreground">{opt.description}</span>
              <span className="mt-2 text-sm font-medium text-primary">
                {loadingValue === opt.value ? "Salvando…" : "Escolher →"}
              </span>
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
