import { DenunciasTable } from "@/components/admin/denuncias-table";
import { getReportsForAdmin } from "@/lib/admin-data";

export default async function AdminDenunciasPage() {
  const reports = await getReportsForAdmin();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Denúncias</h1>
      <DenunciasTable initialReports={reports} />
    </div>
  );
}
