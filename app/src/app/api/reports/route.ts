import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const { professionalId, reason } = await request.json();
  if (!professionalId || !reason) {
    return NextResponse.json({ error: "Preencha o motivo da denúncia." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  // A policy de RLS já exige auth.uid() (não dá pra denunciar sem estar
  // logado), mas checar aqui evita repassar pro usuário o erro cru do
  // Postgres/RLS e devolve uma mensagem que já orienta o que fazer.
  if (!user) {
    return NextResponse.json(
      { error: "Você precisa estar logado para denunciar um perfil." },
      { status: 401 }
    );
  }

  const { error } = await supabase!
    .from("reports")
    .insert({ professional_id: professionalId, reporter_id: user.id, reason });

  if (error) {
    // Código 23505 = violação de unicidade (professional_id, reporter_id) —
    // esse usuário já denunciou esse perfil antes. Evita que a mesma pessoa
    // spamme denúncias contra um concorrente só pra lotar a fila de
    // moderação.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Você já denunciou este perfil. Nossa equipe já foi notificada." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
