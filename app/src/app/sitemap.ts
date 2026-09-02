import type { MetadataRoute } from "next";
import { getAllCitiesWithCounts, getFeaturedProfessionals } from "@/lib/data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://exemplo-onderelaxar.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, professionals] = await Promise.all([
    getAllCitiesWithCounts(),
    getFeaturedProfessionals(100),
  ]);

  // Só entram no sitemap as cidades que já têm pelo menos um profissional
  // publicado. Uma cidade sem profissionais mostra a mensagem "Nenhum
  // profissional encontrado" — para o Google isso tem cara de página de
  // erro, e ele recusa indexar (soft 404), o que só desperdiça orçamento de
  // rastreamento. Assim que a cidade ganhar o primeiro profissional, ela
  // volta a aparecer aqui automaticamente.
  const cityUrls = cities
    .filter((c) => c.count > 0)
    .map((c) => ({
      url: `${BASE_URL}/massagistas/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  // Não incluímos aqui as URLs filtradas por categoria
  // (/massagistas/{cidade}?categoria=x): a página em si declara como
  // canônica sempre a versão sem filtro (ver generateMetadata em
  // massagistas/[cidade]/page.tsx), então enviar essas URLs pro Google como
  // páginas próprias no sitemap contradiz o canonical e pode prejudicar a
  // indexação em vez de ajudar.
  const profileUrls = professionals.map((p) => ({
    url: `${BASE_URL}/perfil/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    ...cityUrls,
    ...profileUrls,
  ];
}
