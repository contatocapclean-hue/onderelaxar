"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/mock-data";
import { Field, ContactField } from "@/components/form-fields";
import type { City, ServiceCategory, Visibility } from "@/lib/types";

interface Props {
  cities: City[];
  categories: ServiceCategory[];
}

interface PhotoDraft {
  url: string;
  kind: "profile" | "venue" | "gallery";
  order: number;
}

const STEPS = ["Perfil profissional", "Fotos", "Contato", "Publicação"];

export function ProfileWizard({ cities, categories }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ status: string } | null>(null);

  // Passo 2
  const [professionalName, setProfessionalName] = useState("");
  const [description, setDescription] = useState("");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [neighborhood, setNeighborhood] = useState("");
  const [attendanceType, setAttendanceType] = useState<"own_place" | "client_home" | "both">("both");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  // Passo 3
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [uploading, setUploading] = useState(false);

  // Passo 4
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsappVisibility, setWhatsappVisibility] = useState<Visibility>("on_request");
  const [phoneVisibility, setPhoneVisibility] = useState<Visibility>("hidden");
  const [emailVisibility, setEmailVisibility] = useState<Visibility>("hidden");
  const [instagramVisibility, setInstagramVisibility] = useState<Visibility>("public");

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, kind: PhotoDraft["kind"]) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured()) {
      // Modo demo: apenas pré-visualização local, não é persistido.
      const url = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { url, kind, order: prev.length }]);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();

    if (!user) {
      setError("Sua sessão expirou. Faça login novamente.");
      setUploading(false);
      return;
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase!.storage.from("profile-photos").upload(path, file);
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: pub } = supabase!.storage.from("profile-photos").getPublicUrl(path);
    setPhotos((prev) => [...prev, { url: pub.publicUrl, kind, order: prev.length }]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(publish: boolean) {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/professional-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professionalName,
        description,
        cityId,
        neighborhood,
        attendanceType,
        venueName,
        venueAddress,
        categoryIds,
        photos,
        contact: {
          whatsapp: whatsapp || null,
          phone: phone || null,
          email: email || null,
          instagram: instagram || null,
          whatsapp_visibility: whatsappVisibility,
          phone_visibility: phoneVisibility,
          email_visibility: emailVisibility,
          instagram_visibility: instagramVisibility,
        },
        publish,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Não foi possível salvar seu perfil.");
      return;
    }

    setSuccess({ status: data.status });
  }

  const selectedCity = cities.find((c) => c.id === cityId);

  if (success) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-10 text-center card-shadow">
        <h2 className="font-display text-2xl text-foreground">Perfil enviado! 🎉</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {success.status === "published"
            ? "Seu perfil já está publicado e pode ser encontrado pelos visitantes."
            : "Seu perfil foi enviado para análise e será publicado assim que aprovado."}
        </p>
        <button
          onClick={() => router.push("/painel")}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Ir para meu painel
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-beige text-muted-foreground"
              }`}
            >
              {i + 2}
            </span>
            <span className={`hidden sm:inline ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8 card-shadow">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl text-foreground">Criar perfil profissional</h2>
            <Field label="Nome profissional">
              <input
                value={professionalName}
                onChange={(e) => setProfessionalName(e.target.value)}
                className="input"
                placeholder="Como você quer ser encontrada(o)"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cidade">
                <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="input">
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.state}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Bairro/região">
                <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="input" />
              </Field>
            </div>
            <Field label="Descrição">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input"
                placeholder="Fale sobre sua experiência e forma de atendimento"
              />
            </Field>
            <Field label="Tipos de massagem">
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      categoryIds.includes(c.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-beige-soft"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Forma de atendimento">
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value as typeof attendanceType)}
                className="input"
              >
                <option value="own_place">Espaço próprio</option>
                <option value="client_home">Domicílio</option>
                <option value="both">Ambos</option>
              </select>
            </Field>
            {attendanceType !== "client_home" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do espaço (opcional)">
                  <input value={venueName} onChange={(e) => setVenueName(e.target.value)} className="input" />
                </Field>
                <Field label="Endereço (opcional)">
                  <input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} className="input" />
                </Field>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl text-foreground">Fotos</h2>
            <p className="text-sm text-muted-foreground">
              Adicione sua foto principal e fotos do ambiente ou relacionadas ao serviço.
              {!isSupabaseConfigured() && " (modo demonstração: as fotos não são salvas)"}
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
                <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, "gallery")} />
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl text-foreground">Formas de contato</h2>
            <p className="text-sm text-muted-foreground">
              Escolha o que preencher e como cada informação deve aparecer no seu perfil público.
            </p>
            <ContactField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} visibility={whatsappVisibility} onVisibility={setWhatsappVisibility} placeholder="55DDDNÚMERO" />
            <ContactField label="Telefone" value={phone} onChange={setPhone} visibility={phoneVisibility} onVisibility={setPhoneVisibility} />
            <ContactField label="Instagram" value={instagram} onChange={setInstagram} visibility={instagramVisibility} onVisibility={setInstagramVisibility} placeholder="@seuusuario" />
            <ContactField label="E-mail" value={email} onChange={setEmail} visibility={emailVisibility} onVisibility={setEmailVisibility} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl text-foreground">Prévia do perfil</h2>
            <div className="rounded-[var(--radius-md)] border border-border p-4">
              <div className="flex items-center gap-4">
                {photos[0] && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image src={photos[0].url} alt="" fill className="object-cover" />
                  </div>
                )}
                <div>
                  <p className="font-display text-lg text-foreground">{professionalName || "Seu nome profissional"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCity?.name} — {neighborhood || "bairro"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/90">{description || "Sua descrição aparecerá aqui."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryIds.map((id) => (
                  <span key={id} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-primary">
                    {categories.find((c) => c.id === id)?.name}
                  </span>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                disabled={submitting}
                onClick={() => submit(false)}
                className="rounded-full border border-primary px-5 py-3 text-sm font-medium text-primary hover:bg-beige-soft disabled:opacity-60"
              >
                Salvar como rascunho
              </button>
              <button
                disabled={submitting}
                onClick={() => submit(true)}
                className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? "Publicando…" : "Publicar meu perfil"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-sm font-medium text-muted-foreground disabled:opacity-0"
          >
            ← Voltar
          </button>
          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Continuar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

