import { ProfileWizard } from "@/components/profile-wizard";
import { getCategories, getCities } from "@/lib/data";

export const metadata = {
  title: "Criar perfil profissional",
};

export default async function CadastroPerfilPage() {
  const [cities, categories] = await Promise.all([getCities(), getCategories()]);

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <ProfileWizard cities={cities} categories={categories} />
      </div>
    </div>
  );
}
