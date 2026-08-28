import { createClient } from "@/lib/supabase/server";
import {
  MOCK_CATEGORIES,
  MOCK_CITIES,
  MOCK_PENDING_PROFESSIONALS,
  MOCK_PROFESSIONALS,
  MOCK_REVIEWS,
  MOCK_SITE_SETTINGS,
  isSupabaseConfigured,
} from "@/lib/mock-data";
import type {
  City,
  CityFilters,
  ProfessionalProfile,
  Review,
  ServiceCategory,
  SiteSettings,
} from "@/lib/types";

/**
 * Camada de acesso a dados. Em modo demo (sem Supabase configurado) lê os
 * dados mockados em memória; com Supabase configurado, consulta o banco
 * real respeitando as políticas de RLS (perfis não publicados nunca
 * aparecem para visitantes).
 */

export async function getCities(): Promise<City[]> {
  if (!isSupabaseConfigured()) return MOCK_CITIES;

  const supabase = await createClient();
  const { data } = await supabase!
    .from("cities")
    .select("id, name, state, slug, is_active")
    .eq("is_active", true)
    .order("name");

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
    slug: c.slug,
    isActive: c.is_active,
  }));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return MOCK_SITE_SETTINGS;

  const supabase = await createClient();
  const { data } = await supabase!
    .from("site_settings")
    .select("hero_badge, hero_title, hero_subtitle, cta_title, cta_subtitle, footer_description")
    .eq("id", 1)
    .single();

  if (!data) return MOCK_SITE_SETTINGS;

  return {
    heroBadge: data.hero_badge,
    heroTitle: data.hero_title,
    heroSubtitle: data.hero_subtitle,
    ctaTitle: data.cta_title,
    ctaSubtitle: data.cta_subtitle,
    footerDescription: data.footer_description,
  };
}

export async function getCategories(): Promise<ServiceCategory[]> {
  if (!isSupabaseConfigured()) return MOCK_CATEGORIES;

  const supabase = await createClient();
  const { data } = await supabase!
    .from("service_categories")
    .select("id, name, slug, icon")
    .eq("is_active", true)
    .order("name");

  return data ?? [];
}

const PROFILE_SELECT = `
  id, user_id, professional_name, slug, description, neighborhood,
  profile_photo, attendance_type, venue_name, venue_address,
  verification_status, profile_status, is_featured, plan, created_at,
  city:cities ( id, name, state, slug, is_active ),
  professional_services ( service_categories ( id, name, slug, icon ) ),
  photos ( id, image_url, kind, sort_order ),
  contact_info ( whatsapp, phone, email, instagram, whatsapp_visibility, phone_visibility, email_visibility, instagram_visibility ),
  profile_statistics ( views, whatsapp_clicks, contact_clicks )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ProfessionalProfile {
  return {
    id: row.id,
    userId: row.user_id,
    professionalName: row.professional_name,
    slug: row.slug,
    description: row.description ?? "",
    city: {
      id: row.city.id,
      name: row.city.name,
      state: row.city.state,
      slug: row.city.slug,
      isActive: row.city.is_active,
    },
    neighborhood: row.neighborhood ?? "",
    profilePhoto: row.profile_photo,
    attendanceType: row.attendance_type,
    venueName: row.venue_name,
    venueAddress: row.venue_address,
    verificationStatus: row.verification_status,
    profileStatus: row.profile_status,
    isFeatured: row.is_featured,
    plan: row.plan,
    createdAt: row.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: (row.professional_services ?? []).map((ps: any) => ps.service_categories),
    photos: (row.photos ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({ id: p.id, url: p.image_url, kind: p.kind, order: p.sort_order })),
    contact: row.contact_info
      ? {
          whatsapp: row.contact_info.whatsapp,
          phone: row.contact_info.phone,
          email: row.contact_info.email,
          instagram: row.contact_info.instagram,
          whatsappVisibility: row.contact_info.whatsapp_visibility,
          phoneVisibility: row.contact_info.phone_visibility,
          emailVisibility: row.contact_info.email_visibility,
          instagramVisibility: row.contact_info.instagram_visibility,
        }
      : {
          whatsapp: null,
          phone: null,
          email: null,
          instagram: null,
          whatsappVisibility: "hidden",
          phoneVisibility: "hidden",
          emailVisibility: "hidden",
          instagramVisibility: "hidden",
        },
    stats: row.profile_statistics
      ? {
          views: row.profile_statistics.views,
          whatsappClicks: row.profile_statistics.whatsapp_clicks,
          contactClicks: row.profile_statistics.contact_clicks,
        }
      : { views: 0, whatsappClicks: 0, contactClicks: 0 },
  };
}

export async function getFeaturedProfessionals(limit = 8): Promise<ProfessionalProfile[]> {
  if (!isSupabaseConfigured()) {
    const featured = MOCK_PROFESSIONALS.filter((p) => p.isFeatured);
    if (featured.length) return featured.slice(0, limit);
    // Enquanto nenhum profissional estiver marcado como destaque, mostramos
    // os últimos cadastrados no lugar.
    return [...MOCK_PROFESSIONALS]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  const supabase = await createClient();
  const { data: featuredData } = await supabase!
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("profile_status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (featuredData && featuredData.length) return featuredData.map(mapRow);

  // Enquanto nenhum profissional estiver marcado como destaque, mostramos
  // os últimos cadastrados no lugar.
  const { data: recentData } = await supabase!
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("profile_status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (recentData ?? []).map(mapRow);
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_CITIES.find((c) => c.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("cities")
    .select("id, name, state, slug, is_active")
    .eq("slug", slug)
    .single();

  if (!data) return null;
  return { id: data.id, name: data.name, state: data.state, slug: data.slug, isActive: data.is_active };
}

export async function getProfessionalsByCity(
  citySlug: string,
  filters: CityFilters = {}
): Promise<ProfessionalProfile[]> {
  if (!isSupabaseConfigured()) {
    let results = MOCK_PROFESSIONALS.filter((p) => p.city.slug === citySlug);

    if (filters.neighborhood) {
      results = results.filter((p) =>
        p.neighborhood.toLowerCase().includes(filters.neighborhood!.toLowerCase())
      );
    }
    if (filters.categorySlug) {
      results = results.filter((p) => p.categories.some((c) => c.slug === filters.categorySlug));
    }
    if (filters.attendanceType) {
      results = results.filter(
        (p) => p.attendanceType === filters.attendanceType || p.attendanceType === "both"
      );
    }
    if (filters.verifiedOnly) {
      results = results.filter((p) => p.verificationStatus === "verified");
    }

    switch (filters.sort) {
      case "most_viewed":
        results = [...results].sort((a, b) => b.stats.views - a.stats.views);
        break;
      case "featured":
        results = [...results].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
        break;
      default:
        results = [...results].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return results;
  }

  const supabase = await createClient();
  const city = await getCityBySlug(citySlug);
  if (!city) return [];

  let query = supabase!
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("profile_status", "published")
    .eq("city_id", city.id);

  if (filters.neighborhood) {
    query = query.ilike("neighborhood", `%${filters.neighborhood}%`);
  }
  if (filters.attendanceType) {
    query = query.in("attendance_type", [filters.attendanceType, "both"]);
  }
  if (filters.verifiedOnly) {
    query = query.eq("verification_status", "verified");
  }

  if (filters.sort === "featured") {
    query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
  let results = (data ?? []).map(mapRow);

  // filtro por categoria e ordenação por views são aplicados em memória
  // pois dependem de tabelas relacionadas / coluna não indexada para RLS simples
  if (filters.categorySlug) {
    results = results.filter((p) => p.categories.some((c) => c.slug === filters.categorySlug));
  }
  if (filters.sort === "most_viewed") {
    results = [...results].sort((a, b) => b.stats.views - a.stats.views);
  }

  return results;
}

export async function getProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null> {
  if (!isSupabaseConfigured()) {
    return (
      MOCK_PROFESSIONALS.find((p) => p.slug === slug) ??
      MOCK_PENDING_PROFESSIONALS.find((p) => p.slug === slug) ??
      null
    );
  }

  // Sem filtro de profile_status aqui: a política de RLS de
  // professional_profiles já garante que só perfis publicados, o próprio
  // dono ou um admin conseguem ler a linha — assim o admin consegue abrir
  // o link do perfil para aprovar/revisar perfis ainda não publicados.
  const supabase = await createClient();
  const { data } = await supabase!
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("slug", slug)
    .single();

  if (!data) return null;
  return mapRow(data);
}

/** Retorna as avaliações de um profissional, mais recentes primeiro. */
export async function getProfessionalReviews(professionalId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_REVIEWS.filter((r) => r.professionalId === professionalId);
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("reviews")
    .select("id, professional_id, reviewer_id, reviewer_name, rating, comment, created_at")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    professionalId: r.professional_id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));
}

/** Retorna o usuário autenticado atual (ou null). Em modo demo, retorna um
 * usuário fictício para permitir navegar pelo painel sem Supabase. */
export async function getCurrentAuthUser() {
  if (!isSupabaseConfigured()) {
    return { id: "demo-user", email: "demo@onderelaxar.app", name: "Conta demonstração" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "", name: (user.user_metadata?.name as string) ?? "" };
}

/** Retorna o perfil profissional do usuário logado. Em modo demo, retorna
 * o primeiro profissional de exemplo para que o painel seja navegável. */
export async function getCurrentUserProfessionalProfile(): Promise<ProfessionalProfile | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_PROFESSIONALS[0] ?? null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return null;

  const { data } = await supabase!
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return mapRow(data);
}

/** Verifica se o usuário logado é admin (inclui super_admin). Em modo demo,
 * retorna true para permitir explorar a área administrativa. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return false;

  const { data } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" || data?.role === "super_admin";
}

/** Verifica se o usuário logado é o administrador master (dono do site), o
 * único com acesso a "Configurações do site". Em modo demo, retorna true. */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return false;

  const { data } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "super_admin";
}

export async function getAllCitiesWithCounts(): Promise<(City & { count: number })[]> {
  const cities = await getCities();
  if (!isSupabaseConfigured()) {
    return cities.map((c) => ({
      ...c,
      count: MOCK_PROFESSIONALS.filter((p) => p.city.slug === c.slug).length,
    }));
  }

  const supabase = await createClient();
  const counts = await Promise.all(
    cities.map(async (c) => {
      const { count } = await supabase!
        .from("professional_profiles")
        .select("id", { count: "exact", head: true })
        .eq("city_id", c.id)
        .eq("profile_status", "published");
      return { ...c, count: count ?? 0 };
    })
  );
  return counts;
}
