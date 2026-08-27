"use client";

import { useState } from "react";
import type { MockReport } from "@/lib/mock-data";

const STATUS_LABEL: Record<string, string> = {
  open: "Aberta",
  reviewed: "Revisada",
  dismissed: "Descartada",
};

export function DenunciasTable({ initialReports }: { initialReports: MockReport[] }) {
  const [reports, setReports] = useState(initialReports);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as MockReport["status"] } : r)));
  }

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma denúncia registrada.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface card-shadow">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="p-3">Profissional</th>
            <th className="p-3">Motivo</th>
            <th className="p-3">Status</th>
            <th className="p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="p-3 font-medium text-foreground">{r.professionalName}</td>
              <td className="p-3 text-muted-foreground">{r.reason}</td>
              <td className="p-3">
                <span className="rounded-full bg-beige px-2.5 py-1 text-xs">{STATUS_LABEL[r.status]}</span>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(r.id, "reviewed")} className="text-xs font-medium text-primary hover:underline">
                    Marcar revisada
                  </button>
                  <button onClick={() => updateStatus(r.id, "dismissed")} className="text-xs font-medium text-muted-foreground hover:underline">
                    Descartar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
