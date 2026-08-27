"use client";

import { useState } from "react";
import { AuthCard } from "@/components/auth-card";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Não foi possível enviar o e-mail.");
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <AuthCard title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha.">
      {status === "sent" ? (
        <p className="text-sm text-foreground">
          Se este e-mail estiver cadastrado, você receberá um link de redefinição em instantes.
        </p>
      ) : (
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Enviar link
          </button>
        </form>
      )}
    </AuthCard>
  );
}
