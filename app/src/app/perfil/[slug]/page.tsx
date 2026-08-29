import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentAuthUser, getProfessionalBySlug, getProfessionalReviews } from "@/lib/data";
import { ViewTracker } from "@/components/view-tracker";
import { ProfileView } from "@/components/perfil/profile-view";

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
    <div className="container-page py-6 sm:py-10">
      <ViewTracker professionalId={professional.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {professional.profileStatus !== "published" && (
        // Se chegamos até aqui com um perfil não publicado, é porque a RLS
        // já garantiu que somente o dono ou um admin conseguem visualizá-lo.
        <div className="mx-1 mb-6 rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:mx-0">
          {isOwner
            ? "Seu perfil ainda não foi publicado. Esta é uma prévia de como ele ficará assim que for aprovado."
            : `Prévia administrativa — este perfil está com status "${professional.profileStatus}" e ainda não é visível ao público.`}
        </div>
      )}

      <ProfileView
        professional={professional}
        reviews={reviews}
        isLoggedIn={Boolean(currentUser)}
        isOwner={isOwner}
        existingUserReview={existingUserReview}
      />
    </div>
  );
}
