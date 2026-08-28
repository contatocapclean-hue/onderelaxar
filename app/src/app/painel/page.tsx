import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { getCurrentAuthUser, getCurrentUserProfessionalProfile } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/mock-data";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending_review: "Em análise",
  published: "Publicado",
  rejected: "Reprovado",
  suspended: "Suspenso",
};

export default async function PainelPage() {
  const [profile, user] = await Promise.all([getCurrentUserProfessionalProfile(), getCurrentAuthUser()]);

  if (!profile) {
    // Conta "visitante": nunca é levada ao assistente de perfil profissional
    // — só navega pelo site normalmente.
    if (user?.accountType === "visitante") {
      return (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-beige-soft p-10 text-center">
          <h1 className="font-display text-xl text-foreground">Você está cadastrado como visitante</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta é só para navegar e encontrar profissionais — sem perfil profissional para gerenciar por aqui.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Encontrar profissionais
            </Link>
            <Link
              href="/cadastro/perfil"
              className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-beige-soft"
            >
              Na verdade, quero anunciar
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-beige-soft p-10 text-center">
        <h1 className="font-display text-xl text-foreground">Você ainda não criou seu perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete o cadastro para começar a divulgar seus serviços.
        </p>
        <Link
          href="/cadastro/perfil"
          className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Criar meu perfil
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!isSupabaseConfigured() && (
        <div className="mb-6 rounded-[var(--radius-md)] bg-primary/5 p-3 text-xs text-primary">
          Modo demonstração — exibindo o perfil de exemplo &quot;{profile.professionalName}&quot;.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-foreground">Olá, {profile.professionalName}</h1>
          <p className="text-sm text-muted-foreground">
            Status do perfil:{" "}
            <span className="font-medium text-foreground">{STATUS_LABEL[profile.profileStatus]}</span>
          </p>
        </div>
        <Link
          href={`/perfil/${profile.slug}`}
          target="_blank"
          className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft"
        >
          Ver meu perfil público ↗
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Visualizações do perfil" value={profile.stats.views} />
        <StatCard label="Cliques no WhatsApp" value={profile.stats.whatsappClicks} />
        <StatCard label="Novos contatos" value={profile.stats.contactClicks} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/painel/perfil" className="rounded-[var(--radius-md)] border border-border bg-surface p-5 hover:bg-beige-soft">
          <p className="font-medium text-foreground">Editar meu perfil</p>
          <p className="text-sm text-muted-foreground">Nome, descrição, cidade e bairro.</p>
        </Link>
        <Link href="/painel/fotos" className="rounded-[var(--radius-md)] border border-border bg-surface p-5 hover:bg-beige-soft">
          <p className="font-medium text-foreground">Gerenciar fotos</p>
          <p className="text-sm text-muted-foreground">Foto principal e galeria.</p>
        </Link>
        <Link href="/painel/carteira" className="rounded-[var(--radius-md)] border border-border bg-surface p-5 hover:bg-beige-soft">
          <p className="font-medium text-foreground">Carteira</p>
          <p className="text-sm text-muted-foreground">
            Saldo: {(profile.walletBalanceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            {" · "}Depositar, destacar perfil e publicar stories.
          </p>
        </Link>
      </div>
    </div>
  );
}
