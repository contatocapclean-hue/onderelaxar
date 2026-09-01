"use client";

import { useState } from "react";

export function ReportButton({ professionalId }: { professionalId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Antes o erro era ignorado e a mensagem de sucesso aparecia mesmo
        // quando a denúncia falhava (ex.: usuário não logado, ou denúncia
        // duplicada). Agora mostramos o motivo real devolvido pela API.
        setError(data.error ?? "Não foi possível enviar sua denúncia. Tente novamente.");
        return;
      }
      setSent(true);
    } catch {
      setError("Não foi possível enviar sua denúncia. Verifique sua conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-muted-foreground underline hover:text-foreground">
        Denunciar este perfil
      </button>
    );
  }

  if (sent) {
    return <p className="text-xs text-muted-foreground">Denúncia enviada. Obrigado por ajudar a manter a plataforma segura.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-border bg-beige-soft p-3">
      <textarea
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Descreva o motivo da denúncia"
        rows={3}
        className="input"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Enviar denúncia"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}
