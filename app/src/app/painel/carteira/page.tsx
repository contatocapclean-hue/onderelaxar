import { CarteiraForm } from "@/components/painel/carteira-form";
import { getCurrentUserProfessionalProfile, getWalletTransactions } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelCarteiraPage() {
  const profile = await getCurrentUserProfessionalProfile();
  if (!profile) redirect("/painel");

  const transactions = await getWalletTransactions(profile.id);

  return (
    <div>
      <h1 className="font-display mb-2 text-2xl text-foreground">Carteira</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Deposite via Pix para ter saldo. Destacar o perfil e publicar stories agora ficam na aba{" "}
        <a href="/painel/perfil" className="underline hover:text-primary">
          Meu perfil
        </a>
        .
      </p>
      <CarteiraForm profile={profile} transactions={transactions} />
    </div>
  );
}
