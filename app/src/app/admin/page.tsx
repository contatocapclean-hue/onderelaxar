import { StatCard } from "@/components/stat-card";
import { getAdminOverview } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/mock-data";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div>
      {!isSupabaseConfigured() && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-primary/5 p-3 text-xs text-primary">
          Modo demonstração — exibindo dados de exemplo.
        </div>
      )}
      <h1 className="font-display mb-6 text-2xl text-foreground">Painel administrativo</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total de usuários" value={overview.totalUsers} />
        <StatCard label="Perfis ativos" value={overview.activeProfiles} />
        <StatCard label="Perfis pendentes" value={overview.pendingProfiles} />
        <StatCard label="Novos cadastros (7 dias)" value={overview.newSignups7d} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Cidade com mais profissionais</p>
          <p className="font-display text-xl text-foreground">{overview.topCity}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Serviço mais cadastrado</p>
          <p className="font-display text-xl text-foreground">{overview.topService}</p>
        </div>
      </div>
    </div>
  );
}
