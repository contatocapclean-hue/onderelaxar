import { getCurrentAuthUser, getCurrentUserProfessionalProfile } from "@/lib/data";
import { redirect } from "next/navigation";

const PLAN_LABEL: Record<string, string> = {
  free: "Gratuito",
  featured: "Destaque",
  premium: "Premium",
};

export default async function PainelConfiguracoesPage() {
  const [user, profile] = await Promise.all([getCurrentAuthUser(), getCurrentUserProfessionalProfile()]);
  if (!profile) redirect("/cadastro/perfil");

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Configurações</h1>

      <div className="flex flex-col gap-6">
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 card-shadow">
          <h2 className="font-medium text-foreground">Conta</h2>
          <p className="mt-2 text-sm text-muted-foreground">Nome: {user?.name || "—"}</p>
          <p className="text-sm text-muted-foreground">E-mail: {user?.email}</p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 card-shadow">
          <h2 className="font-medium text-foreground">Plano atual</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você está no plano <span className="font-medium text-primary">{PLAN_LABEL[profile.plan]}</span> — a
            divulgação é 100% gratuita. Planos com destaque e recursos extras chegarão em breve.
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-5">
          <h2 className="font-medium text-red-700">Zona de risco</h2>
          <p className="mt-2 text-sm text-red-700/80">
            Para suspender ou excluir seu perfil, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}
