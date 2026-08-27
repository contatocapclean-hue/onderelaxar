import type { City, ProfessionalProfile, ServiceCategory, SiteSettings } from "./types";

// Dados de demonstração usados quando NEXT_PUBLIC_SUPABASE_URL não está
// configurado, para que a plataforma seja navegável imediatamente.
// Nenhuma foto/nome real é usada — imagens são placeholders gerados.

export const MOCK_CITIES: City[] = [
  { id: "c1", name: "Salvador", state: "BA", slug: "salvador-ba", isActive: true },
  { id: "c2", name: "Feira de Santana", state: "BA", slug: "feira-de-santana-ba", isActive: true },
  { id: "c3", name: "Lauro de Freitas", state: "BA", slug: "lauro-de-freitas-ba", isActive: true },
  { id: "c4", name: "Camaçari", state: "BA", slug: "camacari-ba", isActive: true },
];

export const MOCK_CATEGORIES: ServiceCategory[] = [
  { id: "s1", name: "Massagem Relaxante", slug: "massagem-relaxante", icon: "sparkles" },
  { id: "s2", name: "Massagem Terapêutica", slug: "massagem-terapeutica", icon: "heart-pulse" },
  { id: "s3", name: "Massagem Desportiva", slug: "massagem-desportiva", icon: "dumbbell" },
  { id: "s4", name: "Drenagem Linfática", slug: "drenagem-linfatica", icon: "droplet" },
  { id: "s5", name: "Massagem Modeladora", slug: "massagem-modeladora", icon: "wand" },
  { id: "s6", name: "Shiatsu", slug: "shiatsu", icon: "hand" },
  { id: "s7", name: "Reflexologia", slug: "reflexologia", icon: "footprints" },
  { id: "s8", name: "Massagem Ayurvédica", slug: "massagem-ayurvedica", icon: "leaf" },
  { id: "s9", name: "Pedras Quentes", slug: "pedras-quentes", icon: "flame" },
  { id: "s10", name: "Outros Serviços", slug: "outros-servicos", icon: "plus" },
];

function cat(...slugs: string[]): ServiceCategory[] {
  return slugs.map((s) => MOCK_CATEGORIES.find((c) => c.slug === s)!);
}

const names = [
  "Mariana Silva", "Camila Souza", "Fernanda Alves", "Beatriz Costa", "Juliana Lima",
  "Patrícia Nunes", "Renata Farias", "Larissa Prado", "Débora Ramos", "Aline Torres",
  "Carla Menezes", "Vanessa Rocha",
];

const neighborhoods = ["Pituba", "Barra", "Rio Vermelho", "Itaigara", "Caminho das Árvores", "Graça", "Centro", "Stella Maris"];

function seededPhoto(seed: string, w = 480, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export const MOCK_PROFESSIONALS: ProfessionalProfile[] = names.map((name, i) => {
  const id = `p${i + 1}`;
  const slug = `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-")}-${i + 1}`;
  const cityIdx = i % MOCK_CITIES.length;
  const c = MOCK_CITIES[cityIdx];
  const categories = [
    cat("massagem-relaxante", "drenagem-linfatica", "massagem-terapeutica"),
    cat("massagem-desportiva", "pedras-quentes"),
    cat("shiatsu", "reflexologia", "massagem-ayurvedica"),
    cat("massagem-modeladora", "drenagem-linfatica"),
  ][i % 4];

  return {
    id,
    userId: `u${i + 1}`,
    professionalName: name,
    slug,
    description:
      "Atendimento personalizado focado em relaxamento, bem-estar e qualidade de vida, com técnicas adaptadas para cada necessidade.",
    city: c,
    neighborhood: neighborhoods[i % neighborhoods.length],
    profilePhoto: seededPhoto(slug),
    attendanceType: (["own_place", "client_home", "both"] as const)[i % 3],
    venueName: i % 3 !== 1 ? "Espaço Equilíbrio" : null,
    venueAddress: null,
    verificationStatus: i % 3 === 0 ? "verified" : "unverified",
    profileStatus: "published",
    isFeatured: i < 4,
    plan: i < 2 ? "premium" : i < 4 ? "featured" : "free",
    createdAt: new Date(Date.now() - i * 86400000 * 12).toISOString(),
    categories,
    photos: [1, 2, 3].map((n) => ({
      id: `${id}-photo-${n}`,
      url: seededPhoto(`${slug}-${n}`, 640, 480),
      kind: "gallery" as const,
      order: n,
    })),
    contact: {
      whatsapp: "5571999990000",
      phone: null,
      email: null,
      instagram: `@${slug.replace(/-/g, "")}`,
      whatsappVisibility: "on_request",
      phoneVisibility: "hidden",
      emailVisibility: "hidden",
      instagramVisibility: "public",
    },
    stats: {
      views: 400 + i * 137,
      whatsappClicks: 20 + i * 6,
      contactClicks: 5 + i * 2,
    },
  };
});

// Textos editáveis da home/rodapé em modo demonstração — os mesmos valores
// padrão gravados pela migration supabase/migrations/0003_site_settings.sql.
export const MOCK_SITE_SETTINGS: SiteSettings = {
  heroBadge: "Divulgação 100% gratuita para profissionais",
  heroTitle: "Encontre profissionais de massagem perto de você",
  heroSubtitle:
    "Descubra profissionais, conheça seus serviços e encontre a opção ideal para o seu momento de relaxamento e bem-estar.",
  ctaTitle: "É profissional de massagem? Divulgue seu trabalho gratuitamente.",
  ctaSubtitle: "Crie seu perfil em poucos minutos e comece a ser encontrado por clientes na sua cidade.",
  footerDescription: "Diretório de profissionais de massagem. Divulgação gratuita, feita para conectar bem-estar e confiança.",
};

// Perfis extras usados apenas na área administrativa de demonstração, para
// ilustrar a fila de moderação (não aparecem na busca pública).
export const MOCK_PENDING_PROFESSIONALS: ProfessionalProfile[] = [
  {
    ...MOCK_PROFESSIONALS[0],
    id: "pending-1",
    professionalName: "Tatiane Freitas",
    slug: "tatiane-freitas-pendente",
    profileStatus: "pending_review",
    verificationStatus: "unverified",
    isFeatured: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    ...MOCK_PROFESSIONALS[1],
    id: "pending-2",
    professionalName: "Sabrina Costa",
    slug: "sabrina-costa-pendente",
    profileStatus: "pending_review",
    verificationStatus: "unverified",
    isFeatured: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export const MOCK_USERS: MockUser[] = MOCK_PROFESSIONALS.map((p, i) => ({
  id: p.userId,
  name: p.professionalName,
  email: `${p.slug}@exemplo.com`,
  role: i === 0 ? "admin" : "user",
  createdAt: p.createdAt,
}));

export interface MockReport {
  id: string;
  professionalId: string;
  professionalName: string;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
}

export const MOCK_REPORTS: MockReport[] = [
  {
    id: "r1",
    professionalId: MOCK_PROFESSIONALS[2].id,
    professionalName: MOCK_PROFESSIONALS[2].professionalName,
    reason: "Suspeita de fotos que não são do profissional",
    status: "open",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "r2",
    professionalId: MOCK_PROFESSIONALS[5].id,
    professionalName: MOCK_PROFESSIONALS[5].professionalName,
    reason: "Informações de contato desatualizadas",
    status: "reviewed",
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
