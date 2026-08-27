import { CategoriasManager } from "@/components/admin/categorias-manager";
import { getAllCategoriesForAdmin } from "@/lib/admin-data";

export default async function AdminCategoriasPage() {
  const categories = await getAllCategoriesForAdmin();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Categorias de massagem</h1>
      <CategoriasManager initialCategories={categories} />
    </div>
  );
}
