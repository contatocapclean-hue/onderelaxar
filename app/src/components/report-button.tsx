"use client";

import { useState } from "react";

export function ReportButton({ professionalId }: { professionalId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, reason }),
    });
    setSent(true);
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
      <div className="flex gap-2">
        <button type="submit" className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
          Enviar denúncia
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground">
          Cancelar
        </button>
      </div>
    </form>
  );
}
