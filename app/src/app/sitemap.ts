import type { MetadataRoute } from "next";
import { getCities, getCategories, getFeaturedProfessionals } from "@/lib/data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://exemplo-onderelaxar.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, categories, professionals] = await Promise.all([
    getCities(),
    getCategories(),
    getFeaturedProfessionals(100),
  ]);

  const cityUrls = cities.map((c) => ({
    url: `${BASE_URL}/massagistas/${c.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.flatMap((cat) =>
    cities.map((c) => ({
      url: `${BASE_URL}/massagistas/${c.slug}?categoria=${cat.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }))
  );

  const profileUrls = professionals.map((p) => ({
    url: `${BASE_URL}/perfil/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    ...cityUrls,
    ...categoryUrls,
    ...profileUrls,
  ];
}
