import { ServicosForm } from "@/components/painel/servicos-form";
import { getCategories, getCurrentUserProfessionalProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelServicosPage() {
  const [profile, categories] = await Promise.all([getCurrentUserProfessionalProfile(), getCategories()]);
  if (!profile) redirect("/cadastro/perfil");

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Serviços</h1>
      <ServicosForm profile={profile} categories={categories} />
    </div>
  );
}
