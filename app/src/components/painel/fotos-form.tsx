"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/mock-data";
import { compressImageIfNeeded } from "@/lib/image-compress";
import type { ProfessionalProfile } from "@/lib/types";

type WorkingPhoto = { url: string; kind: "profile" | "venue" | "gallery"; order: number };

/** Fotos e capa: cada ação (adicionar, remover, destacar, trocar capa) salva
 * sozinha na hora, sem precisar de um botão "Salvar" separado — antes era
 * preciso lembrar de clicar em salvar depois de apagar uma foto, e quem
 * saía da página sem isso via a foto "voltar" como se apagar não tivesse
 * funcionado. */
export function FotosForm({ profile }: { profile: ProfessionalProfile }) {
  // profile.profilePhoto é apenas um "cache" da URL da primeira foto da
  // galeria (profile.photos[0]) — não é uma foto separada. Antes, esse
  // valor era sempre inserido de novo na lista, criando uma cópia
  // duplicada da foto principal a cada vez que o formulário era salvo
  // (e a duplicata ficava ainda maior a cada salvamento seguinte). Agora
  // deduplicamos por URL para montar a lista inicial com segurança.
  const initialCandidates: WorkingPhoto[] = [
    ...(profile.profilePhoto ? [{ url: profile.profilePhoto, kind: "profile" as const, order: -1 }] : []),
    ...profile.photos.map((p) => ({ url: p.url, kind: p.kind, order: p.order })),
  ];
  const seenUrls = new Set<string>();
  const initial = initialCandidates.filter((p) => {
    if (seenUrls.has(p.url)) return false;
    seenUrls.add(p.url);
    return true;
  });
  const [photos, setPhotos] = useState(initial);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(profile.coverPhoto);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const demo = !isSupabaseConfigured();

  // Fonte da verdade "ao vivo" pra fotos/capa, separada do state do React.
  // Cada ação aqui salva sozinha (sem botão "Salvar"), e o PATCH do servidor
  // sempre substitui a galeria inteira — então, se duas ações acontecerem
  // perto uma da outra (ex.: apagar uma foto enquanto o upload de outra
  // ainda está em andamento, ou duas chamadas de salvar concorrentes cuja
  // resposta chega fora de ordem), um envio baseado num valor "capturado"
  // antigo podia reescrever a galeria e ressuscitar uma foto já apagada.
  // Os refs guardam sempre o valor mais atual pra cada ação ler antes de
  // montar o próximo estado, e a fila abaixo garante um envio por vez —
  // nunca dois PATCHs de fotos em voo ao mesmo tempo.
  const photosRef = useRef(initial);
  const coverRef = useRef<string | null>(profile.coverPhoto);
  const saveLoopRunning = useRef(false);
  const savePending = useRef(false);

  function applyPhotos(next: WorkingPhoto[]) {
    photosRef.current = next;
    setPhotos(next);
  }

  function applyCover(next: string | null) {
    coverRef.current = next;
    setCoverPhoto(next);
  }

  /** Marca que existe uma versão nova pra salvar e garante que só exista um
   * loop de salvamento rodando por vez. Se um salvamento já estiver em
   * andamento quando outra ação acontece, essa ação só marca "pendente" —
   * o loop, ao terminar o envio atual, dispara mais um envio lendo os refs
   * de novo (então sempre acaba mandando o estado mais recente, nunca um
   * envio antigo por cima de um mais novo). */
  function scheduleSave() {
    savePending.current = true;
    if (saveLoopRunning.current) return;
    saveLoopRunning.current = true;
    void runSaveLoop();
  }

  async function runSaveLoop() {
    while (savePending.current) {
      savePending.current = false;
      await persist(photosRef.current, coverRef.current);
    }
    saveLoopRunning.current = false;
  }

  async function uploadToStorage(file: File, prefix: string): Promise<string | null> {
    if (demo) {
      return URL.createObjectURL(file);
    }

    // Redimensiona/comprime antes de enviar — sem isso, uma foto de câmera
    // ou gerada por IA em altíssima resolução (já vimos casos de 20+ MB)
    // vai parar direto no Supabase e é servida assim, sem compressão nenhuma,
    // toda vez que o perfil é visitado.
    const compressed = await compressImageIfNeeded(file);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) return null;

    const path = `${user.id}/${prefix}-${Date.now()}-${compressed.name}`;
    const { error } = await supabase!.storage.from("profile-photos").upload(path, compressed);
    if (error) {
      setMessage(error.message);
      return null;
    }
    const { data: pub } = supabase!.storage.from("profile-photos").getPublicUrl(path);
    return pub.publicUrl;
  }

  /** Envia ao servidor o estado dado (fotos + capa). Só é chamada pelo loop
   * de salvamento acima, nunca diretamente — assim nunca há duas chamadas
   * concorrentes disputando pra ver qual termina por último. */
  async function persist(nextPhotos: WorkingPhoto[], nextCover: string | null) {
    if (demo) {
      setMessage("Modo demonstração: alterações não são persistidas.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/professional-profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: nextPhotos.map((p, i) => ({ ...p, order: i })),
          coverPhoto: nextCover,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Erro ao salvar. Tente novamente.");
      }
    } catch {
      setMessage("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    const url = await uploadToStorage(file, "gallery");
    setUploading(false);
    if (!url) return;

    // Lê photosRef (não o "photos" capturado no início desta função) porque
    // o upload acima é assíncrono e pode levar vários segundos — tempo de
    // sobra pra profissional apagar outra foto nesse meio tempo. Se
    // usássemos o "photos" da closure, a lista antiga (ainda com a foto já
    // apagada) seria reenviada aqui, ressuscitando-a.
    const current = photosRef.current;
    const next = [...current, { url, kind: "gallery" as const, order: current.length }];
    applyPhotos(next);
    scheduleSave();
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingCover(true);
    const url = await uploadToStorage(file, "cover");
    setUploadingCover(false);
    if (!url) return;

    applyCover(url);
    scheduleSave();
  }

  async function removeCoverPhoto() {
    applyCover(null);
    scheduleSave();
  }

  async function removePhoto(index: number) {
    const next = photosRef.current.filter((_, i) => i !== index);
    applyPhotos(next);
    scheduleSave();
  }

  // Deixa a profissional escolher qual foto quer destacar como foto de
  // perfil (avatar), em vez de depender da ordem em que as fotos foram
  // enviadas. "Destacar" só reordena a lista, trazendo a foto escolhida
  // para a primeira posição — é essa posição que já era usada como foto
  // de perfil.
  async function makeProfilePhoto(index: number) {
    const current = photosRef.current;
    if (index <= 0 || index >= current.length) return;
    const copy = [...current];
    const [chosen] = copy.splice(index, 1);
    const next = [chosen, ...copy];
    applyPhotos(next);
    scheduleSave();
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
              <input type="file" accept="image/*" hidden onChange={handleCoverChange} disabled={uploadingCover} />
            </label>
            {coverPhoto && (
              <button
                type="button"
                onClick={removeCoverPhoto}
                className="text-xs text-red-600 hover:underline"
              >
                Remover capa
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mb-1 text-sm text-muted-foreground">
        A foto marcada como &quot;Perfil&quot; é usada como avatar do seu perfil. Clique na estrela de outra foto
        para destacá-la no lugar.
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        {demo
          ? "Modo demonstração: alterações não são persistidas."
          : "Cada ação aqui (adicionar, apagar, destacar ou trocar a capa) já salva sozinha na hora — não precisa de um botão \"Salvar\"."}
      </p>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative h-24 w-24 overflow-hidden rounded-[var(--radius-sm)] border border-border">
            <Image src={p.url} alt="" fill className="object-cover" />
            <button
              onClick={() => removePhoto(i)}
              aria-label="Remover foto"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
            >
              ×
            </button>
            {i === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                Perfil
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeProfilePhoto(i)}
                aria-label="Destacar como foto de perfil"
                title="Destacar como foto de perfil"
                className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
              >
                ★
              </button>
            )}
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border text-xs text-muted-foreground hover:bg-beige-soft">
          {uploading ? "Enviando…" : "+ Foto"}
          <input type="file" accept="image/*" hidden onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>
      {(saving || message) && (
        <p className="mt-4 text-sm text-foreground/80" role="status">
          {saving ? "Salvando…" : message}
        </p>
      )}
    </div>
  );
}
