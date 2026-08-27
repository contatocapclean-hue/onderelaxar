import Image from "next/image";
import Link from "next/link";

export function Header() {
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
          <Link
            href="/entrar"
            className="hidden sm:inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-beige-soft transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            Criar meu perfil
          </Link>
        </div>
      </div>
    </header>
  );
}
