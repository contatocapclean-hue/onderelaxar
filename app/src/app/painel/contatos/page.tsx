import { redirect } from "next/navigation";

// Contato agora é uma sub-aba de "Meu perfil". Mantemos esta rota como
// redirecionamento para não quebrar links/favoritos antigos.
export default function PainelContatosPage() {
  redirect("/painel/perfil?tab=contato");
}
