import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

/** Grava o objetivo escolhido logo após o passo 1 do cadastro: "anunciante"
 * (segue para o assistente de perfil profissional) ou "visitante" (pula o
 * assistente e vai direto para a home). */
export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Modo demonstração: configure o Supabase para habilitar cadastro real." },
      { status: 400 }
    );
  }

  const { accountType } = await request.json();
  if (accountType !== "anunciante" && accountType !== "visitante") {
    return NextResponse.json({ error: "Objetivo inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { error } = await supabase!.from("profiles").update({ account_type: accountType }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
