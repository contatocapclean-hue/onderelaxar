import { createClient } from "@/lib/supabase/server";
import {
  MOCK_CATEGORIES,
  MOCK_CITIES,
  MOCK_PENDING_PROFESSIONALS,
  MOCK_PROFESSIONALS,
  MOCK_REVIEWS,
  MOCK_SITE_SETTINGS,
  MOCK_STORIES,
  MOCK_WALLET_PRICING,
  MOCK_WALLET_TRANSACTIONS,
  isSupabaseConfigured,
} from "@/lib/mock-data";
import type {
  AccountType,
  City,
  CityFilters,
  ProfessionalProfile,
  Review,
  ServiceCategory,
  SiteSettings,
  Story,
  WalletPricing,
  WalletTransaction,
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
    .select(
      "hero_badge, hero_title, hero_subtitle, cta_title, cta_subtitle, footer_description, system_story_media_url, system_story_media_type, system_story_updated_at"
    )
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
    systemStory: {
      mediaUrl: data.system_story_media_url,
      mediaType: data.system_story_media_type,
      updatedAt: data.system_story_updated_at,
    },
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
  verification_status, profile_status, is_featured, featured_until,
  wallet_balance_cents, plan, created_at,
  city:cities ( id, name, state, slug, is_active ),
  professional_services ( service_categories ( id, name, slug, icon ) ),
  photos ( id, image_url, kind, sort_order ),
  contact_info ( whatsapp, phone, email, instagram, whatsapp_visibility, phone_visibility, email_visibility, instagram_visibility ),
  profile_statistics ( views, whatsapp_clicks, contact_clicks )
`;

/** Um perfil só está "de fato" em destaque se is_featured estiver ligado
 * E (não tiver data de expiração — destaque manual do admin — ou essa data
 * ainda não tiver passado). Evita mostrar como destaque um perfil cujo
 * período pago já venceu, sem precisar de um job agendado para "desligar"
 * is_featured no banco. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEffectivelyFeatured(row: any): boolean {
  if (!row.is_featured) return false;
  if (!row.featured_until) return true;
  return new Date(row.featured_until).getTime() > Date.now();
}

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
    isFeatured: isEffectivelyFeatured(row),
    featuredUntil: row.featured_until,
    plan: row.plan,
    createdAt: row.created_at,
    walletBalanceCents: row.wallet_balance_cents ?? 0,
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
  const nowIso = new Date().toISOString();
  const { data: featuredData } = await supabase!
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("profile_status", "published")
    .eq("is_featured", true)
    .or(`featured_until.is.null,featured_until.gt.${nowIso}`)
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

/** Demais profissionais publicados, fora dos já exibidos em destaque —
 * usado na home para a seção "Todas as outras profissionais", com cards
 * menores que os de destaque. */
export async function getOtherProfessionals(
  excludeIds: string[],
  limit = 24
): Promise<ProfessionalProfile[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_PROFESSIONALS.filter((p) => !excludeIds.includes(p.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  const supabase = await createClient();
  let query = supabase!
    .from("professional_profiles")
    .select(PROFILE_SELECT)
    .eq("profile_status", "published")
    .order("created_at", { ascending: false })
    .limit(limit + excludeIds.length);

  if (excludeIds.length) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data } = await query;
  return (data ?? []).map(mapRow).slice(0, limit);
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
  if (filters.sort === "featured") {
    // reordena em memória usando isFeatured "de fato" (considera
    // featured_until) — a ordenação feita na query acima usa a coluna
    // bruta, que pode estar desatualizada para um destaque já vencido.
    results = [...results].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
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
    return {
      id: "demo-user",
      email: "demo@onderelaxar.app",
      name: "Conta demonstração",
      accountType: "anunciante" as AccountType,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return null;

  const { data: profileRow } = await supabase!
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string) ?? "",
    // account_type nulo (conta anterior a esse recurso, ou que ainda não
    // respondeu à pergunta em /cadastro/objetivo) é tratado como anunciante.
    accountType: (profileRow?.account_type as AccountType | null) ?? "anunciante",
  };
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

const FALLBACK_FEATURED_DAYS = 7;

/** Preços atuais da carteira (destaque e story), lidos das tabelas plans e
 * site_settings — assim o admin pode ajustar os valores só com um UPDATE
 * no banco, sem precisar de novo deploy. */
export async function getWalletPricing(): Promise<WalletPricing> {
  if (!isSupabaseConfigured()) return MOCK_WALLET_PRICING;

  const supabase = await createClient();
  const [{ data: plan }, { data: settings }] = await Promise.all([
    supabase!.from("plans").select("price_cents").eq("code", "featured").single(),
    supabase!.from("site_settings").select("story_price_cents").eq("id", 1).single(),
  ]);

  return {
    featuredPriceCents: plan?.price_cents ?? MOCK_WALLET_PRICING.featuredPriceCents,
    featuredDays: FALLBACK_FEATURED_DAYS,
    storyPriceCents: settings?.story_price_cents ?? MOCK_WALLET_PRICING.storyPriceCents,
  };
}

/** Extrato de movimentações da carteira do profissional logado (mais
 * recentes primeiro). */
export async function getWalletTransactions(professionalId: string): Promise<WalletTransaction[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_WALLET_TRANSACTIONS.filter((t) => t.professionalId === professionalId);
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("wallet_transactions")
    .select("id, professional_id, type, amount_cents, description, created_at")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((t) => ({
    id: t.id,
    professionalId: t.professional_id,
    type: t.type,
    amountCents: t.amount_cents,
    description: t.description,
    createdAt: t.created_at,
  }));
}

/** Stories ativos (não expirados) de perfis publicados, para a barra de
 * stories da home. Um por profissional na listagem (o mais recente),
 * agrupamento e ordem de exibição de cada story individual ficam a cargo
 * do componente cliente. */
/** Story fixo do sistema (publicado pelo admin master em Configurações do
 * site) como um Story sintético — sem professionalId real, não expira
 * sozinho e é sempre o primeiro da barra. `null` se nenhum estiver
 * configurado. */
function systemStoryEntry(settings: SiteSettings): Story | null {
  if (!settings.systemStory.mediaUrl || !settings.systemStory.mediaType) return null;
  return {
    id: "system-story",
    professionalId: "system",
    professionalName: "Onde Relaxar",
    professionalSlug: "",
    professionalPhoto: null,
    mediaUrl: settings.systemStory.mediaUrl,
    mediaType: settings.systemStory.mediaType,
    createdAt: settings.systemStory.updatedAt ?? new Date().toISOString(),
    // sem expiração real: fixado bem no futuro para reaproveitar o mesmo tipo Story.
    expiresAt: new Date(Date.now() + 100 * 365 * 86400000).toISOString(),
  };
}

export async function getActiveStories(): Promise<Story[]> {
  const settings = await getSiteSettings();
  const system = systemStoryEntry(settings);
  const pinned = system ? [system] : [];

  if (!isSupabaseConfigured()) {
    return [...pinned, ...MOCK_STORIES.filter((s) => new Date(s.expiresAt).getTime() > Date.now())];
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("stories")
    .select(
      "id, professional_id, media_url, media_type, created_at, expires_at, professional_profiles!inner ( professional_name, slug, profile_photo, profile_status )"
    )
    .eq("professional_profiles.profile_status", "published")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stories = (data ?? []).map((s: any) => ({
    id: s.id,
    professionalId: s.professional_id,
    professionalName: s.professional_profiles.professional_name,
    professionalSlug: s.professional_profiles.slug,
    professionalPhoto: s.professional_profiles.profile_photo,
    mediaUrl: s.media_url,
    mediaType: s.media_type,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
  }));

  return [...pinned, ...stories];
}

/** Stories do próprio profissional logado (inclusive para gerenciar no
 * painel), ativos ou não — usado só na tela "Minha carteira". */
export async function getOwnStories(professionalId: string): Promise<Story[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_STORIES.filter((s) => s.professionalId === professionalId);
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("stories")
    .select("id, professional_id, media_url, media_type, created_at, expires_at")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    professionalId: s.professional_id,
    professionalName: "",
    professionalSlug: "",
    professionalPhoto: null,
    mediaUrl: s.media_url,
    mediaType: s.media_type,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
  }));
}
