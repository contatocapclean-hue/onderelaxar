import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

/**
 * Garante que a requisição vem de um admin autenticado. Retorna o cliente
 * Supabase pronto para uso, ou um erro para a rota devolver.
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: "Modo demonstração: configure o Supabase para realizar ações administrativas reais." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Acesso restrito a administradores." };

  return { supabase: supabase! };
}
