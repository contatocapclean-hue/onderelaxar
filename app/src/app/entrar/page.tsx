"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard } from "@/components/auth-card";

function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setResendMessage(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Não foi possível entrar.");
      setNeedsConfirmation(data.code === "email_not_confirmed");
      return;
    }
    router.push(searchParams.get("next") ?? "/painel");
    router.refresh();
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);
    const res = await fetch("/api/auth/resend-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setResending(false);
    setResendMessage(res.ok ? "E-mail de confirmação reenviado." : data.error ?? "Não foi possível reenviar.");
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesse seu painel de profissional.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {needsConfirmation && (
          <div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
            >
              {resending ? "Reenviando…" : "Reenviar e-mail de confirmação"}
            </button>
            {resendMessage && <p className="mt-1 text-sm text-muted-foreground">{resendMessage}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/recuperar-senha" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
          <Link href="/cadastro" className="text-primary hover:underline">
            Criar conta
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <EntrarForm />
    </Suspense>
  );
}
