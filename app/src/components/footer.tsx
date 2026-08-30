import Image from "next/image";
import Link from "next/link";
import { MOCK_CITIES } from "@/lib/mock-data";
import { getSiteSettings } from "@/lib/data";

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-border bg-beige-soft mt-24">
      <div className="container-page py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Image src="/logo-onde-relaxar.png" alt="Onde Relaxar" width={640} height={266} className="h-10 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {settings.footerDescription}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Cidades</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {MOCK_CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/massagistas/${c.slug}`} className="hover:text-primary transition-colors">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Profissionais</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/cadastro" className="hover:text-primary transition-colors">
                Criar meu perfil gratuito
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="hover:text-primary transition-colors">
                Acessar meu painel
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Plataforma</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/termos" className="hover:text-primary transition-colors">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-primary transition-colors">
                Privacidade
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Onde Relaxar. Todos os direitos reservados.
      </div>
    </footer>
  );
}
