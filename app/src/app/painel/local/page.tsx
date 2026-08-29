import { redirect } from "next/navigation";

// Local de atendimento agora é uma sub-aba de "Meu perfil". Mantemos esta
// rota como redirecionamento para não quebrar links/favoritos antigos.
export default function PainelLocalPage() {
  redirect("/painel/perfil?tab=local");
}
