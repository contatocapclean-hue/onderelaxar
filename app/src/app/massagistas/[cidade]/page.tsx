import type { Metadata } from "next";
import { CityListing } from "@/components/city-listing";
import { getCityBySlug } from "@/lib/data";

interface Props {
  params: Promise<{ cidade: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade } = await params;
  const city = await getCityBySlug(cidade);
  if (!city) return {};

  return {
    title: `Profissionais de Massagem em ${city.name}`,
    description: `Encontre e compare profissionais de massagem em ${city.name} (${city.state}). Filtre por bairro, tipo de massagem e forma de atendimento.`,
    alternates: { canonical: `/massagistas/${city.slug}` },
  };
}

export default async function CidadePage({ params, searchParams }: Props) {
  const { cidade } = await params;
  const sp = await searchParams;

  return (
    <CityListing
      citySlug={cidade}
      neighborhood={sp.bairro}
      categorySlug={sp.categoria}
      attendanceType={sp.atendimento}
      verifiedOnly={sp.verificado === "1"}
      sort={sp.ordenar}
    />
  );
}
