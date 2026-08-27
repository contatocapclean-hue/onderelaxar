import { StatCard } from "@/components/stat-card";
import { getCurrentUserProfessionalProfile } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelEstatisticasPage() {
  const profile = await getCurrentUserProfessionalProfile();
  if (!profile) redirect("/cadastro/perfil");

  const conversionRate = profile.stats.views
    ? ((profile.stats.whatsappClicks + profile.stats.contactClicks) / profile.stats.views) * 100
    : 0;

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Estatísticas</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Visualizações do perfil" value={profile.stats.views} />
        <StatCard label="Cliques no WhatsApp" value={profile.stats.whatsappClicks} />
        <StatCard label="Novos contatos" value={profile.stats.contactClicks} />
      </div>
      <div className="mt-6 rounded-[var(--radius-md)] border border-border bg-surface p-5 card-shadow">
        <p className="text-sm text-muted-foreground">Taxa de conversão em contato</p>
        <p className="font-display text-2xl text-foreground">{conversionRate.toFixed(1)}%</p>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Perfis em destaque e verificados costumam receber mais visualizações.
        Complete seu perfil com fotos e descrição detalhada para melhorar seus resultados.
      </p>
    </div>
  );
}
