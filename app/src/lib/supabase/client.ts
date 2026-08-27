"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/mock-data";

/**
 * Cliente Supabase para uso em Client Components.
 * Retorna null quando as variáveis de ambiente não estão configuradas —
 * nesse caso a aplicação roda em modo demo com dados mockados
 * (ver src/lib/data.ts).
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
