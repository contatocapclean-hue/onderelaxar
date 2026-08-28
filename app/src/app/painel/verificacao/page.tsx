import { redirect } from "next/navigation";
import { getCurrentUserProfessionalProfile } from "@/lib/data";
import { VerificacaoForm } from "@/components/painel/verificacao-form";

export default async function PainelVerificacaoPage() {
  const profile = await getCurrentUserProfessionalProfile();
  if (!profile) redirect("/painel");

  return (
    <div>
      <h1 className="font-display mb-2 text-2xl text-foreground">Verificação de perfil</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Confirme que as fotos do seu perfil são realmente suas e ganhe o selo de{" "}
        <span className="font-medium text-foreground">Verificado</span> — a conferência é automática, sem
        precisar esperar aprovação.
      </p>
      <VerificacaoForm verificationStatus={profile.verificationStatus} />
    </div>
  );
}
