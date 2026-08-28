"use client";

import { useState } from "react";
import type { ContactInfo } from "@/lib/types";

function track(professionalId: string, field: "whatsapp_clicks" | "contact_clicks") {
  fetch("/api/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ professionalId, field }),
  }).catch(() => {});
}

export function ContactButtons({
  professionalId,
  professionalName,
  contact,
}: {
  professionalId: string;
  professionalName: string;
  contact: ContactInfo;
}) {
  const [revealed, setRevealed] = useState(false);

  const whatsappDigits = contact.whatsapp ? contact.whatsapp.replace(/\D/g, "") : "";
  const whatsappMessage = `Olá ${professionalName}, encontrei seu perfil no www.onderelaxar.com.br. Gostaria de saber mais informações.`;
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`;

  const hasOnRequest =
    contact.whatsappVisibility === "on_request" ||
    contact.phoneVisibility === "on_request" ||
    contact.emailVisibility === "on_request" ||
    contact.instagramVisibility === "on_request";

  const showWhatsapp =
    contact.whatsapp && (contact.whatsappVisibility === "public" || (contact.whatsappVisibility === "on_request" && revealed));
  const showPhone =
    contact.phone && (contact.phoneVisibility === "public" || (contact.phoneVisibility === "on_request" && revealed));
  const showEmail =
    contact.email && (contact.emailVisibility === "public" || (contact.emailVisibility === "on_request" && revealed));
  const showInstagram =
    contact.instagram && (contact.instagramVisibility === "public" || (contact.instagramVisibility === "on_request" && revealed));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {showWhatsapp && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track(professionalId, "whatsapp_clicks")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            WhatsApp
          </a>
        )}

        {showInstagram && (
          <a
            href={`https://instagram.com/${contact.instagram!.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-beige-soft"
          >
            Instagram
          </a>
        )}

        {showPhone && (
          <a
            href={`tel:${contact.phone}`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-beige-soft"
          >
            Ligar
          </a>
        )}

        {showEmail && (
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-beige-soft"
          >
            E-mail
          </a>
        )}

        {!revealed && hasOnRequest && (
          <button
            type="button"
            onClick={() => {
              setRevealed(true);
              track(professionalId, "contact_clicks");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Entrar em contato
          </button>
        )}
      </div>

      {!showWhatsapp && !showPhone && !showEmail && !showInstagram && !hasOnRequest && (
        <p className="text-sm text-muted-foreground">
          Este profissional ainda não disponibilizou formas de contato públicas.
        </p>
      )}
    </div>
  );
}
