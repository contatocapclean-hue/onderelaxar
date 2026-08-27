import { LocalForm } from "@/components/painel/local-form";
import { getCurrentUserProfessionalProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelLocalPage() {
  const profile = await getCurrentUserProfessionalProfile();
  if (!profile) redirect("/cadastro/perfil");

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Local de atendimento</h1>
      <LocalForm profile={profile} />
    </div>
  );
}
