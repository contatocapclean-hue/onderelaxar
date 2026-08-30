import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
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
