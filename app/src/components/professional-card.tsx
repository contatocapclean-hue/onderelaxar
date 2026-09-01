import Image from "next/image";
import Link from "next/link";
import type { ProfessionalProfile } from "@/lib/types";
import { BLUR_DATA_URL } from "@/lib/utils";
import { VerifiedBadge } from "./verified-badge";

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 21;
}

export function ProfessionalCard({ professional }: { professional: ProfessionalProfile }) {
  const profileHref = `/perfil/${professional.slug}`;
  const whatsappDigits = professional.contact?.whatsapp
    ? professional.contact.whatsapp.replace(/\D/g, "")
    : "";
  // WhatsApp é o canal de contato principal da plataforma e sempre é
  // exibido quando o profissional cadastrou um número — não depende mais de
  // visibilidade configurável (ver ContactField / contatos-form.tsx).
  const showWhatsapp = Boolean(whatsappDigits);
  const whatsappMessage = `Olá ${professional.professionalName}, encontrei seu perfil no www.onderelaxar.com.br. Gostaria de saber mais informações.`;
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="group overflow-hidden rounded-[var(--radius-lg)] bg-surface card-shadow border border-border transition-transform hover:-translate-y-0.5">
      <Link
        href={profileHref}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-beige-soft"
      >
        {professional.profilePhoto && (
          <Image
            src={professional.profilePhoto}
            alt={professional.professionalName}
            fill
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            quality={70}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Verificado fica sozinho no canto esquerdo; Novo e Destaque ficam
         * empilhados no canto direito — assim nenhum badge fica um em cima
         * do outro na mesma linha/canto. */}
        {professional.verificationStatus === "verified" && (
          <div className="absolute left-3 top-3">
            <VerifiedBadge />
          </div>
        )}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {isNew(professional.createdAt) && (
            <span className="inline-flex w-fit items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-primary">
              Novo
            </span>
          )}
          {professional.isFeatured && (
            <span className="inline-flex w-fit items-center rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
              Destaque
            </span>
          )}
        </div>

        {/* Nome + cidade sobrepostos na própria foto, com gradiente para legibilidade */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-3 pb-2.5 pt-10">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <h3 className="font-display truncate text-base leading-tight text-white">
              {professional.professionalName}
            </h3>
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-white/85">
              <span aria-hidden>📍</span>
              {professional.city.name}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex gap-2 p-2.5">
        {showWhatsapp ? (
          <>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-[2] items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#25D366] px-2 py-2 text-sm font-medium text-white transition-colors hover:brightness-95"
            >
              WhatsApp
            </a>
            <Link
              href={profileHref}
              className="inline-flex flex-[3] items-center justify-center whitespace-nowrap rounded-full border border-border px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-beige-soft"
            >
              Ver perfil
            </Link>
          </>
        ) : (
          <Link
            href={profileHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-beige-soft"
          >
            Ver perfil completo
          </Link>
        )}
      </div>
    </div>
  );
}
