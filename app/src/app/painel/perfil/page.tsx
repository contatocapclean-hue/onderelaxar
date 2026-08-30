import { PerfilTabs } from "@/components/painel/perfil-tabs";
import {
  getCategories,
  getCities,
  getCurrentUserProfessionalProfile,
  getOwnStories,
  getWalletPricing,
} from "@/lib/data";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PainelPerfilPage({ searchParams }: Props) {
  const [profile, cities, categories, sp] = await Promise.all([
    getCurrentUserProfessionalProfile(),
    getCities(),
    getCategories(),
    searchParams,
  ]);
  if (!profile) redirect("/painel");

  const [pricing, stories] = await Promise.all([getWalletPricing(), getOwnStories(profile.id)]);

  return (
    <PerfilTabs
      profile={profile}
      cities={cities}
      categories={categories}
      pricing={pricing}
      stories={stories}
      initialTab={sp.tab}
    />
  );
}
