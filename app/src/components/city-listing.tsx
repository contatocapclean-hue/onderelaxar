import { FiltersBar } from "@/components/filters-bar";
import { ProfessionalCard } from "@/components/professional-card";
import { getCategories, getCityBySlug, getProfessionalsByCity } from "@/lib/data";
import type { AttendanceType, SortOption } from "@/lib/types";
import { notFound } from "next/navigation";

export interface CityListingParams {
  citySlug: string;
  neighborhood?: string;
  categorySlug?: string;
  attendanceType?: string;
  verifiedOnly?: boolean;
  sort?: string;
  lockedNeighborhood?: boolean;
}

export async function CityListing({
  citySlug,
  neighborhood,
  categorySlug,
  attendanceType,
  verifiedOnly,
  sort,
  lockedNeighborhood,
}: CityListingParams) {
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const [categories, professionals] = await Promise.all([
    getCategories(),
    getProfessionalsByCity(citySlug, {
      neighborhood,
      categorySlug,
      attendanceType: attendanceType as AttendanceType | undefined,
      verifiedOnly,
      sort: sort as SortOption | undefined,
    }),
  ]);

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          Profissionais de Massagem em {city.name}
          {lockedNeighborhood && neighborhood ? ` — ${neighborhood}` : ""}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Encontre profissionais disponíveis em {city.name} ({city.state}) e
          filtre por bairro, tipo de massagem e forma de atendimento.
        </p>
      </header>

      <div className="mb-8">
        <FiltersBar categories={categories} />
      </div>

      {professionals.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-border bg-beige-soft p-12 text-center">
          <p className="text-foreground font-medium">
            Nenhum profissional encontrado com esses filtros.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente ajustar os filtros ou volte em breve — novos perfis são
            publicados regularmente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {professionals.map((p) => (
            <ProfessionalCard key={p.id} professional={p} />
          ))}
        </div>
      )}
    </div>
  );
}
