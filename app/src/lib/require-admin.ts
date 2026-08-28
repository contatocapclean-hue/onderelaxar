import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

/**
 * Garante que a requisição vem de um admin autenticado (inclui o
 * administrador master/super_admin). Retorna o cliente Supabase pronto
 * para uso, ou um erro para a rota devolver.
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
  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { error: "Acesso restrito a administradores." };
  }

  return { supabase: supabase! };
}

/**
 * Garante que a requisição vem do administrador master (super_admin) — usado
 * pelas rotas de "Configurações do site", que nem admins comuns podem
 * alterar. Retorna o cliente Supabase pronto para uso, ou um erro.
 */
export async function requireSuperAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: "Modo demonstração: configure o Supabase para realizar ações administrativas reais." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") {
    return { error: "Acesso restrito ao administrador master." };
  }

  return { supabase: supabase! };
}
