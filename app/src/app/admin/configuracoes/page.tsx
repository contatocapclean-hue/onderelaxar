import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getSiteSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/mock-data";

export default async function AdminConfiguracoesPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      {!isSupabaseConfigured() && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-primary/5 p-3 text-xs text-primary">
          Modo demonstração — as alterações não são salvas até você conectar o Supabase.
        </div>
      )}
      <h1 className="font-display mb-2 text-2xl text-foreground">Configurações do site</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Edite os textos da página inicial e do rodapé sem precisar mexer em código.
      </p>
      <SiteSettingsForm initialSettings={settings} />
    </div>
  );
}
