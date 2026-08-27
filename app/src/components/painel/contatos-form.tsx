"use client";

import { useState } from "react";
import { ContactField } from "@/components/form-fields";
import type { ProfessionalProfile, Visibility } from "@/lib/types";

export function ContatosForm({ profile }: { profile: ProfessionalProfile }) {
  const [whatsapp, setWhatsapp] = useState(profile.contact.whatsapp ?? "");
  const [phone, setPhone] = useState(profile.contact.phone ?? "");
  const [email, setEmail] = useState(profile.contact.email ?? "");
  const [instagram, setInstagram] = useState(profile.contact.instagram ?? "");
  const [whatsappVisibility, setWhatsappVisibility] = useState<Visibility>(profile.contact.whatsappVisibility);
  const [phoneVisibility, setPhoneVisibility] = useState<Visibility>(profile.contact.phoneVisibility);
  const [emailVisibility, setEmailVisibility] = useState<Visibility>(profile.contact.emailVisibility);
  const [instagramVisibility, setInstagramVisibility] = useState<Visibility>(profile.contact.instagramVisibility);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/professional-profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Contatos atualizados." : data.error ?? "Erro ao salvar.");
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
      <ContactField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} visibility={whatsappVisibility} onVisibility={setWhatsappVisibility} placeholder="55DDDNÚMERO" />
      <ContactField label="Telefone" value={phone} onChange={setPhone} visibility={phoneVisibility} onVisibility={setPhoneVisibility} />
      <ContactField label="Instagram" value={instagram} onChange={setInstagram} visibility={instagramVisibility} onVisibility={setInstagramVisibility} placeholder="@seuusuario" />
      <ContactField label="E-mail" value={email} onChange={setEmail} visibility={emailVisibility} onVisibility={setEmailVisibility} />
      {message && <p className="text-sm text-primary">{message}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar contatos"}
      </button>
    </div>
  );
}
