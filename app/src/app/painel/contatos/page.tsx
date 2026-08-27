import { ContatosForm } from "@/components/painel/contatos-form";
import { getCurrentUserProfessionalProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelContatosPage() {
  const profile = await getCurrentUserProfessionalProfile();
  if (!profile) redirect("/cadastro/perfil");

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Contatos</h1>
      <ContatosForm profile={profile} />
    </div>
  );
}
