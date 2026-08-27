import Link from "next/link";
import { HeroSearch } from "@/components/hero-search";
import { CategoryCard } from "@/components/category-card";
import { ProfessionalCard } from "@/components/professional-card";
import { getAllCitiesWithCounts, getCategories, getCities, getFeaturedProfessionals, getSiteSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/mock-data";

export default async function Home() {
  const [cities, categories, featured, citiesWithCounts, settings] = await Promise.all([
    getCities(),
    getCategories(),
    getFeaturedProfessionals(8),
    getAllCitiesWithCounts(),
    getSiteSettings(),
  ]);

  return (
    <div>
      {!isSupabaseConfigured() && (
        <div className="bg-primary/5 border-b border-border">
          <div className="container-page py-2 text-center text-xs text-primary">
            Modo demonstração — dados de exemplo. Configure o Supabase para dados reais.
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-b from-beige-soft to-background">
        <div className="container-page flex flex-col items-center gap-8 py-20 text-center sm:py-28">
          <span className="rounded-full bg-accent-soft px-4 py-1.5 text-xs font-medium text-primary">
            {settings.heroBadge}
          </span>
          <h1 className="font-display max-w-2xl text-4xl leading-tight text-foreground sm:text-5xl">
            {settings.heroTitle}
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            {settings.heroSubtitle}
          </p>
          <HeroSearch cities={cities} />
        </div>
      </section>

      {/* Categorias */}
      <section id="categorias" className="container-page py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">Categorias</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {/* Profissionais em destaque */}
      <section className="bg-beige-soft py-16 sm:py-20">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl text-foreground sm:text-3xl">
              Profissionais em destaque
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Cidades */}
      <section id="cidades" className="container-page py-16 sm:py-20">
        <h2 className="font-display mb-8 text-2xl text-foreground sm:text-3xl">
          Navegue por cidade
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {citiesWithCounts.map((c) => (
            <Link
              key={c.slug}
              href={`/massagistas/${c.slug}`}
              className="rounded-[var(--radius-md)] border border-border bg-surface p-5 card-shadow transition-transform hover:-translate-y-0.5"
            >
              <p className="font-display text-lg text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.state}</p>
              <p className="mt-3 text-xs font-medium text-primary">
                {c.count} profissionais
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="container-page pb-24">
        <div className="rounded-[var(--radius-lg)] bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="font-display text-2xl sm:text-3xl">
            {settings.ctaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/80">
            {settings.ctaSubtitle}
          </p>
          <Link
            href="/cadastro"
            className="mt-6 inline-flex items-center rounded-full bg-primary-foreground px-6 py-3 text-sm font-medium text-primary transition-opacity hover:opacity-90"
          >
            Criar meu perfil grátis
          </Link>
        </div>
      </section>
    </div>
  );
}
