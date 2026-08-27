import { createClient } from "@/lib/supabase/server";
import {
  MOCK_CATEGORIES,
  MOCK_CITIES,
  MOCK_PENDING_PROFESSIONALS,
  MOCK_PROFESSIONALS,
  MOCK_REPORTS,
  MOCK_USERS,
  isSupabaseConfigured,
  type MockReport,
  type MockUser,
} from "@/lib/mock-data";
import type { City, ProfessionalProfile, ServiceCategory } from "@/lib/types";

export async function getAllCitiesForAdmin(): Promise<City[]> {
  if (!isSupabaseConfigured()) return MOCK_CITIES;

  const supabase = await createClient();
  const { data } = await supabase!.from("cities").select("id, name, state, slug, is_active").order("name");

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
    slug: c.slug,
    isActive: c.is_active,
  }));
}

export async function getAllCategoriesForAdmin(): Promise<(ServiceCategory & { isActive: boolean })[]> {
  if (!isSupabaseConfigured()) return MOCK_CATEGORIES.map((c) => ({ ...c, isActive: true }));

  const supabase = await createClient();
  const { data } = await supabase!
    .from("service_categories")
    .select("id, name, slug, icon, is_active")
    .order("name");

  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, isActive: c.is_active }));
}

/**
 * Funções de leitura para a área administrativa. Dependem das políticas de
 * RLS que dão a usuários com role = 'admin' acesso irrestrito às tabelas
 * (ver supabase/migrations/0002_rls.sql).
 */

const ADMIN_PROFILE_SELECT = `
  id, professional_name, slug, city_id, neighborhood, verification_status,
  profile_status, is_featured, plan, created_at,
  city:cities ( name, state )
`;

export interface AdminProfileRow {
  id: string;
  professionalName: string;
  slug: string;
  cityName: string;
  neighborhood: string;
  verificationStatus: string;
  profileStatus: string;
  isFeatured: boolean;
  plan: string;
  createdAt: string;
}

function mapMockToAdminRow(p: ProfessionalProfile): AdminProfileRow {
  return {
    id: p.id,
    professionalName: p.professionalName,
    slug: p.slug,
    cityName: `${p.city.name} — ${p.city.state}`,
    neighborhood: p.neighborhood,
    verificationStatus: p.verificationStatus,
    profileStatus: p.profileStatus,
    isFeatured: p.isFeatured,
    plan: p.plan,
    createdAt: p.createdAt,
  };
}

export async function getAllProfessionalsForAdmin(): Promise<AdminProfileRow[]> {
  if (!isSupabaseConfigured()) {
    return [...MOCK_PENDING_PROFESSIONALS, ...MOCK_PROFESSIONALS].map(mapMockToAdminRow);
  }

  const supabase = await createClient();
  const { data } = await supabase!
    .from("professional_profiles")
    .select(ADMIN_PROFILE_SELECT)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    professionalName: row.professional_name,
    slug: row.slug,
    cityName: row.city ? `${row.city.name} — ${row.city.state}` : "—",
    neighborhood: row.neighborhood ?? "",
    verificationStatus: row.verification_status,
    profileStatus: row.profile_status,
    isFeatured: row.is_featured,
    plan: row.plan,
    createdAt: row.created_at,
  }));
}

export async function getAllUsersForAdmin(): Promise<MockUser[]> {
  if (!isSupabaseConfigured()) return MOCK_USERS;

  const supabase = await createClient();
  const { data } = await supabase!
    .from("profiles")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.created_at,
  }));
}

export async function getReportsForAdmin(): Promise<MockReport[]> {
  if (!isSupabaseConfigured()) return MOCK_REPORTS;

  const supabase = await createClient();
  const { data } = await supabase!
    .from("reports")
    .select("id, professional_id, reason, status, created_at, professional_profiles(professional_name)")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    professionalId: r.professional_id,
    professionalName: r.professional_profiles?.professional_name ?? "—",
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export interface AdminOverview {
  totalUsers: number;
  activeProfiles: number;
  pendingProfiles: number;
  newSignups7d: number;
  topCity: string;
  topService: string;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [profiles, users] = await Promise.all([getAllProfessionalsForAdmin(), getAllUsersForAdmin()]);

  const activeProfiles = profiles.filter((p) => p.profileStatus === "published").length;
  const pendingProfiles = profiles.filter((p) => p.profileStatus === "pending_review").length;
  const weekAgo = Date.now() - 7 * 86400000;
  const newSignups7d = users.filter((u) => new Date(u.createdAt).getTime() > weekAgo).length;

  const cityCounts = new Map<string, number>();
  profiles.forEach((p) => cityCounts.set(p.cityName, (cityCounts.get(p.cityName) ?? 0) + 1));
  const topCity = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  let topService = "—";
  if (!isSupabaseConfigured()) {
    const serviceCounts = new Map<string, number>();
    [...MOCK_PENDING_PROFESSIONALS, ...MOCK_PROFESSIONALS].forEach((p) =>
      p.categories.forEach((c) => serviceCounts.set(c.name, (serviceCounts.get(c.name) ?? 0) + 1))
    );
    topService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }

  return {
    totalUsers: users.length,
    activeProfiles,
    pendingProfiles,
    newSignups7d,
    topCity,
    topService,
  };
}
