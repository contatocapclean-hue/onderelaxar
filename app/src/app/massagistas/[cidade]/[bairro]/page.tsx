import type { Metadata } from "next";
import { CityListing } from "@/components/city-listing";
import { getCityBySlug } from "@/lib/data";

interface Props {
  params: Promise<{ cidade: string; bairro: string }>;
}

function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade, bairro } = await params;
  const city = await getCityBySlug(cidade);
  if (!city) return {};
  const bairroName = unslugify(bairro);

  return {
    title: `Massagistas em ${bairroName}, ${city.name}`,
    description: `Profissionais de massagem no bairro ${bairroName}, ${city.name} (${city.state}).`,
    alternates: { canonical: `/massagistas/${city.slug}/${bairro}` },
  };
}

export default async function BairroPage({ params }: Props) {
  const { cidade, bairro } = await params;
  const bairroName = unslugify(bairro);

  return <CityListing citySlug={cidade} neighborhood={bairroName} lockedNeighborhood />;
}
