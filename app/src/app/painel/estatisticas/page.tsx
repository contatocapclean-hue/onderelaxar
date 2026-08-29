import { redirect } from "next/navigation";

// As estatísticas agora aparecem direto na Visão geral do painel (incluindo
// a taxa de conversão). Mantemos esta rota como redirecionamento para não
// quebrar links/favoritos antigos.
export default function PainelEstatisticasPage() {
  redirect("/painel");
}
