import { PerfilTabs } from "@/components/painel/perfil-tabs";
import { getCategories, getCities, getCurrentUserProfessionalProfile } from "@/lib/data";
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

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Meu perfil</h1>
      <PerfilTabs profile={profile} cities={cities} categories={categories} initialTab={sp.tab} />
    </div>
  );
}
