import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service_role — ignora RLS. Usar apenas em código de
 * servidor (route handlers de admin, jobs) e nunca expor ao browser.
 * Requer SUPABASE_SERVICE_ROLE_KEY no ambiente (não prefixado com NEXT_PUBLIC_).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
