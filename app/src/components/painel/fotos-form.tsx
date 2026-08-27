"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/mock-data";
import type { ProfessionalProfile } from "@/lib/types";

export function FotosForm({ profile }: { profile: ProfessionalProfile }) {
  const initial = [
    ...(profile.profilePhoto ? [{ url: profile.profilePhoto, kind: "profile" as const, order: 0 }] : []),
    ...profile.photos.map((p) => ({ url: p.url, kind: p.kind, order: p.order })),
  ];
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured()) {
      setPhotos((prev) => [...prev, { url: URL.createObjectURL(file), kind: "gallery", order: prev.length }]);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase!.storage.from("profile-photos").upload(path, file);
    setUploading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    const { data: pub } = supabase!.storage.from("profile-photos").getPublicUrl(path);
    setPhotos((prev) => [...prev, { url: pub.publicUrl, kind: "gallery", order: prev.length }]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/professional-profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: photos.map((p, i) => ({ ...p, order: i })) }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Fotos atualizadas." : data.error ?? "Erro ao salvar.");
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <p className="mb-4 text-sm text-muted-foreground">
        A primeira foto é usada como foto principal do seu perfil.
        {!isSupabaseConfigured() && " (modo demonstração: alterações não são persistidas)"}
      </p>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative h-24 w-24 overflow-hidden rounded-[var(--radius-sm)] border border-border">
            <Image src={p.url} alt="" fill className="object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              ×
            </button>
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border text-xs text-muted-foreground hover:bg-beige-soft">
          {uploading ? "Enviando…" : "+ Foto"}
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </label>
      </div>
      {message && <p className="mt-4 text-sm text-primary">{message}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar fotos"}
      </button>
    </div>
  );
}
