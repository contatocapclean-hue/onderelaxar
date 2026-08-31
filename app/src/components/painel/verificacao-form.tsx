"use client";

import { useEffect, useState } from "react";
import { VerifiedBadge } from "@/components/verified-badge";
import type { VerificationStatus } from "@/lib/types";

interface StatusResponse {
  verificationStatus: VerificationStatus;
  configured: boolean;
  emailConfirmed: boolean;
  hasEnoughPhotos: boolean;
  attemptsToday: number;
  maxAttemptsPerDay: number;
}

export function VerificacaoForm({ verificationStatus }: { verificationStatus: VerificationStatus }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [verified, setVerified] = useState(verificationStatus === "verified");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/painel/verificacao")
      .then((res) => res.json())
      .then((data: StatusResponse) => setStatus(data))
      .finally(() => setLoadingStatus(false));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setResult(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!file) return;
    setSending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("selfie", file);

    const res = await fetch("/api/painel/verificacao", { method: "POST", body: formData });
    const data = await res.json();
    setSending(false);

    if (!res.ok || data.error) {
      setResult({ ok: false, message: data.error ?? "Não foi possível verificar agora. Tente novamente." });
      setStatus((prev) => (prev ? { ...prev, attemptsToday: prev.attemptsToday + 1 } : prev));
      return;
    }

    if (data.matched) {
      setVerified(true);
      setResult({ ok: true, message: "Perfil verificado com sucesso! O selo já está ativo." });
    } else {
      setResult({ ok: false, message: data.error ?? "Não foi possível confirmar. Tente outra selfie." });
      setStatus((prev) => (prev ? { ...prev, attemptsToday: prev.attemptsToday + 1 } : prev));
    }
    setFile(null);
    setPreviewUrl(null);
  }

  async function handleSendConfirmationEmail() {
    setSendingEmail(true);
    setEmailError(null);
    const res = await fetch("/api/painel/confirmar-email", { method: "POST" });
    const data = await res.json();
    setSendingEmail(false);
    if (!res.ok || data.error) {
      setEmailError(data.error ?? "Não foi possível enviar o e-mail agora. Tente novamente.");
      return;
    }
    setEmailLinkSent(true);
  }

  if (verified) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <div className="mb-2">
          <VerifiedBadge />
        </div>
        <p className="text-sm text-muted-foreground">
          Seu perfil já está verificado e o selo aparece nos seus cards e na sua página pública.
        </p>
      </div>
    );
  }

  if (loadingStatus) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!status?.configured) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-beige-soft p-6 text-sm text-muted-foreground">
        A verificação automática ainda está sendo configurada. Volte em breve.
      </div>
    );
  }

  if (!status.emailConfirmed) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-beige-soft p-6 text-sm text-muted-foreground">
        {emailLinkSent ? (
          <p>
            Enviamos um link de confirmação para o seu e-mail de cadastro. Abra seu e-mail e clique no link
            para liberar a verificação de perfil. Se não encontrar, confira a caixa de spam.
          </p>
        ) : (
          <>
            <p>
              Antes de verificar seu perfil, confirme o e-mail que você usou no cadastro — é rapidinho, vamos
              te mandar um link.
            </p>
            <button
              onClick={handleSendConfirmationEmail}
              disabled={sendingEmail}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {sendingEmail ? "Enviando…" : "Enviar link de confirmação"}
            </button>
            {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
          </>
        )}
      </div>
    );
  }

  if (!status.hasEnoughPhotos) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-beige-soft p-6 text-sm text-muted-foreground">
        Adicione ao menos uma foto ao seu perfil antes de verificar — vamos comparar sua selfie com as fotos
        que você já publicou.{" "}
        <a href="/painel/perfil?tab=fotos" className="text-primary hover:underline">
          Ir para Fotos
        </a>
      </div>
    );
  }

  const attemptsLeft = status.maxAttemptsPerDay - status.attemptsToday;
  const limitReached = attemptsLeft <= 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <p className="mb-4 text-sm text-muted-foreground">
        Tire uma selfie com o rosto bem visível e boa iluminação. Vamos comparar automaticamente com as
        fotos do seu perfil — se bater, o selo é liberado na hora, sem precisar de aprovação.
      </p>

      {limitReached ? (
        <p className="text-sm text-red-600">
          Você atingiu o limite de {status.maxAttemptsPerDay} tentativas por hoje. Tente novamente amanhã.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            {previewUrl ? (
              <div className="h-28 w-28 overflow-hidden rounded-[var(--radius-md)] border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selfie" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border text-center text-xs text-muted-foreground hover:bg-beige-soft">
              {previewUrl ? "Trocar selfie" : "+ Tirar selfie"}
              <input type="file" accept="image/*" capture="user" hidden onChange={handleFileChange} />
            </label>
          </div>

          <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            Autorizo o uso desta selfie apenas para comparar com as fotos do meu perfil e confirmar minha
            identidade. A imagem não fica salva — só o resultado da conferência.
          </label>

          <button
            onClick={handleSubmit}
            disabled={!file || !consent || sending}
            className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {sending ? "Conferindo…" : "Enviar para conferência"}
          </button>

          <p className="mt-2 text-xs text-muted-foreground">
            {attemptsLeft} de {status.maxAttemptsPerDay} tentativas restantes hoje.
          </p>
        </>
      )}

      {result && (
        <p className={`mt-4 text-sm ${result.ok ? "text-primary" : "text-red-600"}`}>{result.message}</p>
      )}
    </div>
  );
}
