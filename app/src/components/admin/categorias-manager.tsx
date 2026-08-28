"use client";

import { useState } from "react";
import type { ServiceCategory } from "@/lib/types";

export function CategoriasManager({ initialCategories }: { initialCategories: (ServiceCategory & { isActive: boolean })[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setCategories((prev) => [...prev, { id: `${prev.length + 1}`, name, slug: "", icon: null, isActive: true }]);
    setName("");
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, isActive } : c)));
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4 card-shadow">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nova categoria</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </div>
        <button type="submit" className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
          Adicionar categoria
        </button>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface p-4 card-shadow">
            <p className="font-medium text-foreground">{c.name}</p>
            <button
              onClick={() => toggleActive(c.id, !c.isActive)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                c.isActive ? "bg-accent-soft text-primary" : "bg-beige text-muted-foreground"
              }`}
            >
              {c.isActive ? "Ativa" : "Inativa"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
