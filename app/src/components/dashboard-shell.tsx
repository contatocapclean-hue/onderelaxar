"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/painel", label: "Visão geral" },
  { href: "/painel/perfil", label: "Meu perfil" },
  { href: "/painel/fotos", label: "Fotos" },
  { href: "/painel/carteira", label: "Carteira" },
  { href: "/painel/servicos", label: "Serviços" },
  { href: "/painel/local", label: "Local de atendimento" },
  { href: "/painel/contatos", label: "Contatos" },
  { href: "/painel/estatisticas", label: "Estatísticas" },
  { href: "/painel/configuracoes", label: "Configurações" },
];

export function DashboardShell({
  children,
  hasProfile = true,
}: {
  children: React.ReactNode;
  hasProfile?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Sem perfil profissional (conta visitante, ou anunciante que ainda não
  // completou o cadastro), as demais páginas do painel não fazem sentido —
  // todas redirecionam de volta para "Visão geral" ao serem acessadas.
  const nav = hasProfile ? NAV : NAV.slice(0, 1);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors ${
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-beige-soft"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="mt-2 shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Sair
          </button>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
