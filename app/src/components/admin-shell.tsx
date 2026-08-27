"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/perfis", label: "Perfis" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/cidades", label: "Cidades" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/denuncias", label: "Denúncias" },
  { href: "/admin/configuracoes", label: "Configurações do site" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Administração
        </p>
        <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV.map((item) => (
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
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
