"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminProfileRow } from "@/lib/admin-data";
import type { Photo } from "@/lib/types";

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
  const [photosModalRow, setPhotosModalRow] = useState<AdminProfileRow | null>(null);

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
                    <button
                      onClick={() => setPhotosModalRow(row)}
                      className="text-xs font-medium text-foreground hover:underline"
                    >
                      Fotos
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {photosModalRow && (
        <ModeracaoFotosModal row={photosModalRow} onClose={() => setPhotosModalRow(null)} />
      )}
    </div>
  );
}

/** Moderação de fotos: permite ao admin (inclusive o master) remover
 * qualquer foto já publicada de uma profissional — pro caso de, depois do
 * perfil aprovado, ela trocar por uma foto indevida. Diferente do painel
 * da própria profissional (fotos-form.tsx), aqui é só consulta + remoção,
 * sem upload nem reordenação. */
function ModeracaoFotosModal({ row, onClose }: { row: AdminProfileRow; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/profiles/${row.id}/photos`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Erro ao carregar fotos.");
          return;
        }
        setCoverPhoto(data.coverPhoto ?? null);
        setPhotos(data.photos ?? []);
      } catch {
        if (!cancelled) setError("Erro de conexão. Tente novamente.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  async function removeCover() {
    setRemovingKey("cover");
    setError(null);
    try {
      const res = await fetch(`/api/admin/profiles/${row.id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "cover" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao remover a capa.");
        return;
      }
      setCoverPhoto(null);
    } finally {
      setRemovingKey(null);
    }
  }

  async function removePhoto(photoId: string) {
    setRemovingKey(photoId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/profiles/${row.id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao remover a foto.");
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } finally {
      setRemovingKey(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] bg-surface p-6 card-shadow">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg text-foreground">Fotos de {row.professionalName}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Remova aqui qualquer foto publicada indevidamente após a aprovação do perfil. A remoção é imediata e
              a profissional não é avisada automaticamente.
            </p>
          </div>
          <button onClick={onClose} className="text-xl leading-none text-muted-foreground hover:text-foreground">
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            {coverPhoto && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Foto de capa</p>
                <div className="relative h-24 w-44 overflow-hidden rounded-[var(--radius-sm)] border border-border">
                  <Image src={coverPhoto} alt="" fill className="object-cover" />
                  <button
                    onClick={removeCover}
                    disabled={removingKey === "cover"}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80 disabled:opacity-50"
                    aria-label="Remover capa"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <p className="mb-2 text-xs font-medium text-muted-foreground">Galeria</p>
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma foto na galeria.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-[var(--radius-sm)] border border-border">
                    <Image src={p.url} alt="" fill className="object-cover" />
                    <button
                      onClick={() => removePhoto(p.id)}
                      disabled={removingKey === p.id}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80 disabled:opacity-50"
                      aria-label="Remover foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
