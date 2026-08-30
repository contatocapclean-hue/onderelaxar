"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gallery } from "@/components/gallery";
import { VerifiedBadge } from "@/components/verified-badge";
import { ContactButtons } from "@/components/contact-buttons";
import { ReportButton } from "@/components/report-button";
import { ReviewsSection } from "@/components/reviews-section";
import { attendanceLabel, formatNumber, BLUR_DATA_URL } from "@/lib/utils";
import type { ProfessionalProfile, Review } from "@/lib/types";

export function ProfileView({
  professional,
  reviews,
  isLoggedIn,
  isOwner,
  existingUserReview,
}: {
  professional: ProfessionalProfile;
  reviews: Review[];
  isLoggedIn: boolean;
  isOwner: boolean;
  existingUserReview: Review | null;
}) {
  const router = useRouter();

  const coverPhoto = professional.coverPhoto ?? professional.photos[0]?.url ?? professional.profilePhoto;
  // professional.profilePhoto é sempre a URL de uma das fotos já presentes
  // em professional.photos — não é uma foto extra. Contamos fotos únicas
  // por URL para bater com o que a Galeria realmente exibe.
  const totalPhotos = new Set([
    ...(professional.profilePhoto ? [professional.profilePhoto] : []),
    ...professional.photos.map((p) => p.url),
  ]).size;

  const whatsappDigits = professional.contact.whatsapp ? professional.contact.whatsapp.replace(/\D/g, "") : "";
  const showStickyWhatsapp = Boolean(whatsappDigits) && professional.contact.whatsappVisibility === "public";
  const whatsappMessage = `Olá ${professional.professionalName}, encontrei seu perfil no www.onderelaxar.com.br. Gostaria de saber mais informações.`;
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`;

  function goToReport() {
    document.getElementById("denunciar")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-3xl pb-24 sm:pb-10">
      {/* Capa + avatar */}
      <div className="relative">
        <div className="relative -mx-5 aspect-[21/5] w-[calc(100%+2.5rem)] overflow-hidden bg-beige-soft sm:mx-0 sm:w-full sm:rounded-[var(--radius-lg)]">
          {coverPhoto && (
            <Image
              src={coverPhoto}
              alt={professional.professionalName}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg text-white backdrop-blur-sm"
          >
            ←
          </button>

          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            {professional.isFeatured && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Perfil em destaque
              </span>
            )}
            <button
              type="button"
              onClick={goToReport}
              aria-label="Denunciar este perfil"
              title="Denunciar este perfil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            >
              ⚑
            </button>
          </div>
        </div>

        <div className="flex items-end gap-4 px-1 sm:px-0">
          <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-background bg-beige-soft sm:-mt-14 sm:h-28 sm:w-28">
            {professional.profilePhoto && (
              <Image
                src={professional.profilePhoto}
                alt={professional.professionalName}
                fill
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="112px"
                className="object-cover"
              />
            )}
          </div>
          <div className="mt-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display truncate text-2xl text-foreground">{professional.professionalName}</h1>
              {professional.verificationStatus === "verified" && <VerifiedBadge />}
            </div>
            <p className="text-sm text-muted-foreground">
              {professional.categories[0]?.name ?? "Profissional de massagem"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-sm text-muted-foreground sm:px-0">
        <span>👁 {formatNumber(professional.stats.views)} visualizações</span>
        <span>·</span>
        <span>
          Na plataforma desde{" "}
          {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
            new Date(professional.createdAt)
          )}
        </span>
      </div>

      {/* Atendimento + Localização */}
      <div className="mx-1 mt-4 grid grid-cols-1 gap-3 sm:mx-0 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 card-shadow">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <span aria-hidden>🧴</span> Atendimento
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{attendanceLabel(professional.attendanceType)}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 card-shadow">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <span aria-hidden>📍</span> Localização
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {professional.neighborhood}, {professional.city.name}
          </p>
        </div>
      </div>

      {/* Fotos — exposto, sem aba */}
      <section className="mx-1 mt-8 sm:mx-0">
        <h2 className="font-display text-lg text-foreground">Fotos ({totalPhotos})</h2>
        <div className="mt-3">
          <Gallery
            mainPhoto={professional.profilePhoto}
            photos={professional.photos}
            name={professional.professionalName}
          />
        </div>
      </section>

      {/* Sobre mim — exposto logo após as fotos, sem aba */}
      <div className="mx-1 mt-8 sm:mx-0">
        <section>
          <h2 className="font-display text-lg text-foreground">Sobre mim</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/90">{professional.description}</p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg text-foreground">Serviços oferecidos</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {professional.categories.map((c) => (
              <span key={c.slug} className="rounded-full bg-accent-soft px-3 py-1.5 text-sm text-primary">
                {c.name}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-lg text-foreground">Local de atendimento</h2>
          <p className="mt-2 text-sm text-foreground/90">{attendanceLabel(professional.attendanceType)}</p>
          {professional.venueName && (
            <p className="mt-1 text-sm text-muted-foreground">
              {professional.venueName} — {professional.neighborhood}, {professional.city.name}
            </p>
          )}
        </section>

        <section className="mt-8 border-t border-border pt-6">
          <h2 className="font-display text-lg text-foreground">Formas de contato</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Os dados exibidos respeitam as preferências de privacidade do profissional.
          </p>
          <div className="mt-4">
            <ContactButtons
              professionalId={professional.id}
              professionalName={professional.professionalName}
              contact={professional.contact}
            />
          </div>
        </section>

        <div id="denunciar" className="mt-8">
          <ReportButton professionalId={professional.id} />
        </div>
      </div>

      {/* Avaliações — exposto no final do perfil, sem ser um botão */}
      <div className="mx-1 sm:mx-0">
        <ReviewsSection
          professionalId={professional.id}
          reviews={reviews}
          isLoggedIn={isLoggedIn}
          isOwner={isOwner}
          existingUserReview={existingUserReview}
        />
      </div>

      {/* Barra fixa de WhatsApp (mobile) */}
      {showStickyWhatsapp && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur sm:hidden">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-medium text-white"
          >
            Chamar no WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
