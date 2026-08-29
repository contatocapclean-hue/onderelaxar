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
  const [coverPhoto, setCoverPhoto] = useState<string | null>(profile.coverPhoto);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadToStorage(file: File, prefix: string): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      return URL.createObjectURL(file);
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) return null;

    const path = `${user.id}/${prefix}-${Date.now()}-${file.name}`;
    const { error } = await supabase!.storage.from("profile-photos").upload(path, file);
    if (error) {
      setMessage(error.message);
      return null;
    }
    const { data: pub } = supabase!.storage.from("profile-photos").getPublicUrl(path);
    return pub.publicUrl;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadToStorage(file, "gallery");
    setUploading(false);
    if (url) setPhotos((prev) => [...prev, { url, kind: "gallery", order: prev.length }]);
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const url = await uploadToStorage(file, "cover");
    setUploadingCover(false);
    if (url) setCoverPhoto(url);
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
      body: JSON.stringify({ photos: photos.map((p, i) => ({ ...p, order: i })), coverPhoto }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Fotos atualizadas." : data.error ?? "Erro ao salvar.");
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <div className="mb-6 border-b border-border pb-6">
        <p className="text-sm font-medium text-foreground">Foto de capa</p>
        <p className="mt-1 text-sm text-muted-foreground">
          É a imagem grande exibida no topo do seu perfil. Se não escolher uma, a primeira foto da galeria abaixo é
          usada no lugar.
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-beige-soft">
            {coverPhoto ? (
              <Image src={coverPhoto} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-center text-xs text-muted-foreground">
                Sem capa definida
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-2">
            <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-beige-soft">
              {uploadingCover ? "Enviando…" : coverPhoto ? "Alterar capa" : "Carregar capa"}
              <input type="file" accept="image/*" hidden onChange={handleCoverChange} />
            </label>
            {coverPhoto && (
              <button type="button" onClick={() => setCoverPhoto(null)} className="text-xs text-red-600 hover:underline">
                Remover capa
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        A primeira foto abaixo é usada como foto de perfil (avatar).
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
