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
