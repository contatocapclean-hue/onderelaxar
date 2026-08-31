"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Comparação sem diferenciar maiúsculas/minúsculas e ignorando espaço nas
  // pontas — evita falso "não coincide" por causa de autocapitalize do
  // celular, por exemplo. Só compara depois que a pessoa já preencheu os
  // dois campos, pra não mostrar erro enquanto ela ainda está digitando.
  const emailMismatch =
    confirmEmail.length > 0 && email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase();
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setError("Os e-mails digitados não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Não foi possível criar sua conta.");
      return;
    }
    if (data.needsEmailConfirmation) {
      setEmailSent(true);
      return;
    }
    router.push("/cadastro/objetivo");
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
    setResendMessage(res.ok ? "E-mail reenviado." : data.error ?? "Não foi possível reenviar.");
  }

  if (emailSent) {
    return (
      <AuthCard title="Confirme seu e-mail" subtitle="Falta só um passo para ativar sua conta.">
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação para <span className="font-medium text-foreground">{email}</span>.
          Abra seu e-mail e clique no link para continuar o cadastro. Se não encontrar, confira a caixa de
          spam.
        </p>
        <button
          onClick={handleResend}
          disabled={resending}
          className="mt-4 text-sm font-medium text-primary hover:underline disabled:opacity-60"
        >
          {resending ? "Reenviando…" : "Não recebeu? Reenviar e-mail"}
        </button>
        {resendMessage && <p className="mt-1 text-sm text-muted-foreground">{resendMessage}</p>}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/entrar" className="text-primary hover:underline">
            Voltar para o login
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Criar minha conta"
      subtitle="Passo 1 — depois vamos perguntar o que você procura no Onde Relaxar."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Nome</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
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
          <label className="mb-1 block text-sm font-medium text-foreground">Repita o e-mail</label>
          <input
            type="email"
            required
            autoComplete="off"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            className={`w-full rounded-[var(--radius-sm)] border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary ${
              emailMismatch ? "border-red-400" : "border-border"
            }`}
          />
          {emailMismatch && <p className="mt-1 text-xs text-red-600">Os e-mails não coincidem.</p>}
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
          <PasswordStrengthMeter password={password} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Repita a senha</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            className={`w-full rounded-[var(--radius-sm)] border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary ${
              passwordMismatch ? "border-red-400" : "border-border"
            }`}
          />
          {passwordMismatch && <p className="mt-1 text-xs text-red-600">As senhas não coincidem.</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Criando conta…" : "Continuar"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
