import { clsx, type ClassValue } from "clsx";
import type { ProfessionalProfile, SiteSettings } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Monta um ProfessionalProfile "fake" a partir do card de exemplo do
 * destaque (configurado pelo admin em Configurações), só para renderizar
 * com o mesmo ProfessionalCard usado na home — garante que a prévia
 * mostrada às profissionais seja pixel-a-pixel igual ao que aparece de
 * verdade quando alguém ativa o destaque. Fica em utils.ts (não em data.ts)
 * de propósito: precisa ser importável de componentes client, e data.ts
 * carrega o client do Supabase de servidor. Nunca é salvo no banco nem tem
 * link real (ver prop `disabled` do ProfessionalCard). */
export function buildFeaturedExampleProfile(example: SiteSettings["featuredExample"]): ProfessionalProfile {
  return {
    id: "exemplo-destaque",
    userId: "",
    professionalName: example.name?.trim() || "Nome de exemplo",
    slug: "exemplo",
    description: "",
    city: { id: "", name: example.cityLabel?.trim() || "Sua cidade", state: "", slug: "", isActive: true },
    neighborhood: "",
    profilePhoto: example.photoUrl,
    coverPhoto: null,
    attendanceType: "both",
    venueName: null,
    venueAddress: null,
    verificationStatus: "unverified",
    profileStatus: "published",
    isFeatured: true,
    featuredUntil: null,
    plan: "featured",
    // Data antiga de propósito, pra nunca mostrar o selo "Novo" junto do
    // selo "Destaque" no card de exemplo.
    createdAt: "2020-01-01T00:00:00.000Z",
    categories: [],
    photos: [],
    contact: {
      whatsapp: null,
      phone: null,
      email: null,
      instagram: null,
      whatsappVisibility: "hidden",
      phoneVisibility: "hidden",
      emailVisibility: "hidden",
      instagramVisibility: "hidden",
    },
    stats: { views: 0, whatsappClicks: 0, contactClicks: 0 },
    walletBalanceCents: 0,
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ATTENDANCE_LABEL: Record<string, string> = {
  own_place: "Atende em espaço próprio",
  client_home: "Atende a domicílio",
  both: "Espaço próprio ou domicílio",
};

export function attendanceLabel(type: string): string {
  return ATTENDANCE_LABEL[type] ?? type;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

/** Embaralha uma lista (Fisher-Yates), sem alterar o array original — usado
 * para fazer um "rodízio" na ordem dos perfis em destaque: a cada
 * carregamento de página, uma ordem diferente é sorteada, então nenhum
 * destaque fica sempre por cima só por ter sido marcado como destaque mais
 * recentemente. */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const STRENGTH_LABELS = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];

/** Heurística simples de força de senha — soma pontos por comprimento e por
 * variedade de tipo de caractere (minúscula+maiúscula, número, símbolo).
 * Não é tão sofisticada quanto uma lib como zxcvbn, mas dá um retorno visual
 * imediato o suficiente para desencorajar senhas óbvias tipo "123456", sem
 * precisar adicionar dependência nova ao projeto. */
export function passwordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Senha curta demais não passa de "fraca", mesmo com símbolo/número.
  if (password.length < 6) score = Math.min(score, 1);

  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  return { score: capped, label: STRENGTH_LABELS[capped] };
}

// Placeholder usado como `blurDataURL` nas fotos vindas do Supabase Storage
// (URLs remotas não geram blur automático como imagens importadas
// estaticamente). É só um retângulo na cor do skeleton já usado no site
// (--color-beige-soft) — o próprio Next.js desfoca isso via CSS enquanto a
// foto real carrega, então evita o "flash" branco/vazio antigo.
function toBase64(str: string): string {
  return typeof window === "undefined" ? Buffer.from(str).toString("base64") : window.btoa(str);
}

const BLUR_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="30"><rect width="24" height="30" fill="#f6f1e7"/></svg>`;

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(BLUR_PLACEHOLDER_SVG)}`;
