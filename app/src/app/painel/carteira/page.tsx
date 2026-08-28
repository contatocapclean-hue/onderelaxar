import { CarteiraForm } from "@/components/painel/carteira-form";
import { getCurrentUserProfessionalProfile, getOwnStories, getWalletPricing, getWalletTransactions } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function PainelCarteiraPage() {
  const profile = await getCurrentUserProfessionalProfile();
  if (!profile) redirect("/painel");

  const [pricing, transactions, stories] = await Promise.all([
    getWalletPricing(),
    getWalletTransactions(profile.id),
    getOwnStories(profile.id),
  ]);

  return (
    <div>
      <h1 className="font-display mb-2 text-2xl text-foreground">Carteira</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Deposite via Pix e use o saldo para destacar seu perfil ou publicar stories.
      </p>
      <CarteiraForm profile={profile} pricing={pricing} transactions={transactions} stories={stories} />
    </div>
  );
}
