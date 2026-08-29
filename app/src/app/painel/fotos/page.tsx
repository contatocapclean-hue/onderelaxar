import { redirect } from "next/navigation";

// Fotos agora é uma sub-aba de "Meu perfil". Mantemos esta rota como
// redirecionamento para não quebrar links/favoritos antigos.
export default function PainelFotosPage() {
  redirect("/painel/perfil?tab=fotos");
}
