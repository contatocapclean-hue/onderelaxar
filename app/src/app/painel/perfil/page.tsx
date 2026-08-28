import { PerfilForm } from "@/components/painel/perfil-form";
import { getCities, getCurrentUserProfessionalProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelPerfilPage() {
  const [profile, cities] = await Promise.all([getCurrentUserProfessionalProfile(), getCities()]);
  if (!profile) redirect("/painel");

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Meu perfil</h1>
      <PerfilForm profile={profile} cities={cities} />
    </div>
  );
}
