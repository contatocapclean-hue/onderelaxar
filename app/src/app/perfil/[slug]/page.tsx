import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentAuthUser, getProfessionalBySlug, getProfessionalReviews } from "@/lib/data";
import { Gallery } from "@/components/gallery";
import { ContactButtons } from "@/components/contact-buttons";
import { VerifiedBadge } from "@/components/verified-badge";
import { ViewTracker } from "@/components/view-tracker";
import { ReportButton } from "@/components/report-button";
import { ReviewsSection } from "@/components/reviews-section";
import { attendanceLabel } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getProfessionalBySlug(slug);
  if (!professional) return {};

  return {
    title: `${professional.professionalName} — Massagem em ${professional.city.name}`,
    description: professional.description.slice(0, 155),
    alternates: { canonical: `/perfil/${professional.slug}` },
    openGraph: {
      title: professional.professionalName,
      description: professional.description.slice(0, 155),
      images: professional.profilePhoto ? [professional.profilePhoto] : [],
    },
  };
}

export default async function PerfilPage({ params }: Props) {
  const { slug } = await params;
  const professional = await getProfessionalBySlug(slug);
  if (!professional) notFound();

  const [reviews, currentUser] = await Promise.all([
    getProfessionalReviews(professional.id),
    getCurrentAuthUser(),
  ]);

  const isOwner = currentUser?.id === professional.userId;
  const existingUserReview = currentUser ? reviews.find((r) => r.reviewerId === currentUser.id) ?? null : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: professional.professionalName,
    jobTitle: "Massoterapeuta",
    address: {
      "@type": "PostalAddress",
      addressLocality: professional.city.name,
      addressRegion: professional.city.state,
      addressCountry: "BR",
    },
    image: professional.profilePhoto ?? undefined,
    description: professional.description,
  };

  return (
    <div className="container-page py-10">
      <ViewTracker professionalId={professional.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {professional.profileStatus !== "published" && (
        // Se chegamos até aqui com um perfil não publicado, é porque a RLS
        // já garantiu que somente o dono ou um admin conseguem visualizá-lo.
        <div className="mb-6 rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {isOwner
            ? "Seu perfil ainda não foi publicado. Esta é uma prévia de como ele ficará assim que for aprovado."
            : `Prévia administrativa — este perfil está com status "${professional.profileStatus}" e ainda não é visível ao público.`}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Gallery mainPhoto={professional.profilePhoto} photos={professional.photos} name={professional.professionalName} />
        </div>

        <div className="lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            {professional.verificationStatus === "verified" && <VerifiedBadge />}
            {professional.isFeatured && (
              <span className="rounded-full bg-beige px-2.5 py-1 text-xs font-medium text-primary">
                Perfil em destaque
              </span>
            )}
          </div>

          <h1 className="font-display mt-3 text-3xl text-foreground sm:text-4xl">
            {professional.professionalName}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            📍 {professional.city.name} — {professional.neighborhood}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Na plataforma desde{" "}
            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
              new Date(professional.createdAt)
            )}
          </p>

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground">Sobre o profissional</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-foreground/90">{professional.description}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-display text-lg text-foreground">Serviços oferecidos</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {professional.categories.map((c) => (
                <span
                  key={c.slug}
                  className="rounded-full bg-accent-soft px-3 py-1.5 text-sm text-primary"
                >
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
            <h2 className="font-display text-lg text-foreground">Entrar em contato</h2>
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

          <ReviewsSection
            professionalId={professional.id}
            reviews={reviews}
            isLoggedIn={Boolean(currentUser)}
            isOwner={isOwner}
            existingUserReview={existingUserReview}
          />

          <div className="mt-8">
            <ReportButton professionalId={professional.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
