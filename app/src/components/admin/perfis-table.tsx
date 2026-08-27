"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminProfileRow } from "@/lib/admin-data";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Em análise",
  published: "Publicado",
  rejected: "Reprovado",
  suspended: "Suspenso",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-beige text-foreground/70",
  pending_review: "bg-amber-100 text-amber-800",
  published: "bg-accent-soft text-primary",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-red-100 text-red-700",
};

export function PerfisTable({ initialRows }: { initialRows: AdminProfileRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState<string | null>(null);

  async function updateProfile(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Erro ao atualizar.");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...mapBody(body) } : r)));
  }

  function mapBody(body: Record<string, unknown>) {
    const mapped: Partial<AdminProfileRow> = {};
    if (body.profileStatus) mapped.profileStatus = body.profileStatus as string;
    if (body.verificationStatus) mapped.verificationStatus = body.verificationStatus as string;
    if (typeof body.isFeatured === "boolean") mapped.isFeatured = body.isFeatured;
    return mapped;
  }

  return (
    <div>
      {message && <p className="mb-3 text-sm text-red-600">{message}</p>}
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface card-shadow">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Profissional</th>
              <th className="p-3">Cidade</th>
              <th className="p-3">Status</th>
              <th className="p-3">Verificado</th>
              <th className="p-3">Destaque</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link href={`/perfil/${row.slug}`} target="_blank" className="font-medium text-foreground hover:underline">
                    {row.professionalName}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{row.cityName}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[row.profileStatus]}`}>
                    {STATUS_LABEL[row.profileStatus]}
                  </span>
                </td>
                <td className="p-3">{row.verificationStatus === "verified" ? "Sim" : "Não"}</td>
                <td className="p-3">{row.isFeatured ? "Sim" : "Não"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {row.profileStatus !== "published" && (
                      <button onClick={() => updateProfile(row.id, { profileStatus: "published" })} className="text-xs font-medium text-primary hover:underline">
                        Aprovar
                      </button>
                    )}
                    {row.profileStatus !== "rejected" && (
                      <button onClick={() => updateProfile(row.id, { profileStatus: "rejected" })} className="text-xs font-medium text-red-600 hover:underline">
                        Reprovar
                      </button>
                    )}
                    {row.profileStatus !== "suspended" && (
                      <button onClick={() => updateProfile(row.id, { profileStatus: "suspended" })} className="text-xs font-medium text-red-600 hover:underline">
                        Suspender
                      </button>
                    )}
                    <button
                      onClick={() =>
                        updateProfile(row.id, {
                          verificationStatus: row.verificationStatus === "verified" ? "unverified" : "verified",
                        })
                      }
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      {row.verificationStatus === "verified" ? "Remover selo" : "Verificar"}
                    </button>
                    <button
                      onClick={() => updateProfile(row.id, { isFeatured: !row.isFeatured })}
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      {row.isFeatured ? "Remover destaque" : "Destacar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
