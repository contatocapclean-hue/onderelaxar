import Image from "next/image";
import Link from "next/link";
import { getCurrentAuthUser, getCurrentUserProfessionalProfile, isCurrentUserAdmin } from "@/lib/data";
import { HeaderLogoutButton } from "@/components/header-logout-button";
import { AddStoryButton } from "@/components/add-story-button";

export async function Header() {
  const user = await getCurrentAuthUser();
  const isAdmin = user ? await isCurrentUserAdmin() : false;
  // Só profissionais com perfil cadastrado veem o atalho de story no
  // cabeçalho — não faz sentido para quem ainda não tem perfil.
  const profile = user ? await getCurrentUserProfessionalProfile() : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo-onde-relaxar.png"
            alt="Onde Relaxar"
            width={640}
            height={266}
            priority
            className="h-11 w-auto sm:h-12"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-foreground/80">
          <Link href="/massagistas/salvador-ba" className="hover:text-primary transition-colors">
            Encontrar profissionais
          </Link>
          <Link href="/#categorias" className="hover:text-primary transition-colors">
            Categorias
          </Link>
          <Link href="/#cidades" className="hover:text-primary transition-colors">
            Cidades
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {profile && <AddStoryButton />}
              <span className="hidden lg:inline text-sm text-muted-foreground">
                Olá, {user.name || user.email}
              </span>
              <Link
                href={isAdmin ? "/admin" : "/painel"}
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                {isAdmin ? "Painel administrativo" : "Meu painel"}
              </Link>
              <HeaderLogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/entrar"
                className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-foreground hover:bg-beige-soft transition-colors sm:px-4"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors sm:px-4"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
