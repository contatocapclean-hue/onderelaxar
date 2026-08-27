import { PerfisTable } from "@/components/admin/perfis-table";
import { getAllProfessionalsForAdmin } from "@/lib/admin-data";

export default async function AdminPerfisPage() {
  const rows = await getAllProfessionalsForAdmin();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Perfis</h1>
      <PerfisTable initialRows={rows} />
    </div>
  );
}
