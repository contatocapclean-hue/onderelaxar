"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/types";

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          className={`text-lg leading-none ${readOnly ? "cursor-default" : "cursor-pointer"} ${
            n <= value ? "text-amber-500" : "text-beige"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({
  professionalId,
  reviews,
  isLoggedIn,
  isOwner,
  existingUserReview,
}: {
  professionalId: string;
  reviews: Review[];
  isLoggedIn: boolean;
  isOwner: boolean;
  existingUserReview: Review | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(existingUserReview?.rating ?? 5);
  const [comment, setComment] = useState(existingUserReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/professional-profiles/${professionalId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao enviar avaliação.");
      return;
    }

    setShowForm(false);
    router.refresh();
  }

  async function handleDelete() {
    setSubmitting(true);
    await fetch(`/api/professional-profiles/${professionalId}/reviews`, { method: "DELETE" });
    setSubmitting(false);
    setShowForm(false);
    router.refresh();
  }

  return (
    <section className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-foreground">Avaliações</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StarRating value={Math.round(average)} readOnly />
            <span>
              {average.toFixed(1)} ({reviews.length} avaliaç{reviews.length === 1 ? "ão" : "ões"})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Ainda não há avaliações para este perfil.</p>
      )}

      {reviews.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-[var(--radius-sm)] border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{r.reviewerName}</p>
                <StarRating value={r.rating} readOnly />
              </div>
              {r.comment && <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{r.comment}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR").format(new Date(r.createdAt))}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        {!isLoggedIn && (
          <p className="text-sm text-muted-foreground">
            <a href="/entrar" className="font-medium text-primary hover:underline">
              Faça login
            </a>{" "}
            para avaliar este profissional.
          </p>
        )}

        {isLoggedIn && isOwner && (
          <p className="text-sm text-muted-foreground">Você não pode avaliar o seu próprio perfil.</p>
        )}

        {isLoggedIn && !isOwner && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-sm font-medium text-primary hover:underline">
            {existingUserReview ? "Editar minha avaliação" : "Avaliar este profissional"}
          </button>
        )}

        {isLoggedIn && !isOwner && showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-2 flex flex-col gap-3 rounded-[var(--radius-sm)] border border-border bg-beige-soft p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Sua nota:</span>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <textarea
              value={comment ?? ""}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deixe um comentário (opcional)"
              rows={3}
              className="input"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
              >
                {existingUserReview ? "Salvar alterações" : "Enviar avaliação"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-muted-foreground">
                Cancelar
              </button>
              {existingUserReview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="text-xs text-red-600 hover:underline"
                >
                  Excluir minha avaliação
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
