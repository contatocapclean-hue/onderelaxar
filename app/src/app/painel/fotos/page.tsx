import { FotosForm } from "@/components/painel/fotos-form";
import { getCurrentUserProfessionalProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelFotosPage() {
  const profile = await getCurrentUserProfessionalProfile();
  if (!profile) redirect("/cadastro/perfil");

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Fotos</h1>
      <FotosForm profile={profile} />
    </div>
  );
}
