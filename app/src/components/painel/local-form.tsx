"use client";

import { useState } from "react";
import { Field } from "@/components/form-fields";
import type { AttendanceType, ProfessionalProfile } from "@/lib/types";

export function LocalForm({ profile }: { profile: ProfessionalProfile }) {
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(profile.attendanceType);
  const [venueName, setVenueName] = useState(profile.venueName ?? "");
  const [venueAddress, setVenueAddress] = useState(profile.venueAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/professional-profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceType, venueName, venueAddress }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Local de atendimento atualizado." : data.error ?? "Erro ao salvar.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <Field label="Forma de atendimento">
        <select value={attendanceType} onChange={(e) => setAttendanceType(e.target.value as AttendanceType)} className="input">
          <option value="own_place">Espaço próprio</option>
          <option value="client_home">Domicílio</option>
          <option value="both">Ambos</option>
        </select>
      </Field>
      {attendanceType !== "client_home" && (
        <>
          <Field label="Nome do espaço (opcional)">
            <input value={venueName} onChange={(e) => setVenueName(e.target.value)} className="input" />
          </Field>
          <Field label="Endereço (opcional — não é o endereço residencial)">
            <input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} className="input" />
          </Field>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Seu endereço residencial completo nunca é exibido publicamente.
      </p>
      {message && <p className="text-sm text-primary">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
