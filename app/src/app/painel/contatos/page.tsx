import { redirect } from "next/navigation";

// Contato deixou de ser uma sub-aba própria e virou mais um bloco dentro de
// "Dados". Mantemos esta rota como redirecionamento para não quebrar
// links/favoritos antigos.
export default function PainelContatosPage() {
  redirect("/painel/perfil?tab=dados");
}
