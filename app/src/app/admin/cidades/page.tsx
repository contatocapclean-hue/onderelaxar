import { CidadesManager } from "@/components/admin/cidades-manager";
import { getAllCitiesForAdmin } from "@/lib/admin-data";

export default async function AdminCidadesPage() {
  const cities = await getAllCitiesForAdmin();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Cidades</h1>
      <CidadesManager initialCities={cities} />
    </div>
  );
}
