import { redirect } from "next/navigation";

// Serviços agora é uma sub-aba de "Meu perfil". Mantemos esta rota como
// redirecionamento para não quebrar links/favoritos antigos.
export default function PainelServicosPage() {
  redirect("/painel/perfil?tab=servicos");
}
