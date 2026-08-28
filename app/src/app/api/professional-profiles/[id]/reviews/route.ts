import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Modo demonstração: configure o Supabase para enviar avaliações reais." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Você precisa estar logado para avaliar." }, { status: 401 });
  }

  const body = await request.json();
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Selecione uma nota de 1 a 5." }, { status: 400 });
  }

  const { data: professional } = await supabase!
    .from("professional_profiles")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!professional) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  if (professional.user_id === user.id) {
    return NextResponse.json({ error: "Você não pode avaliar o próprio perfil." }, { status: 400 });
  }

  const { data: profile } = await supabase!.from("profiles").select("name").eq("id", user.id).single();

  const { error } = await supabase!.from("reviews").upsert(
    {
      professional_id: id,
      reviewer_id: user.id,
      reviewer_name: profile?.name || "Usuário",
      rating,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "professional_id,reviewer_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Modo demonstração: configure o Supabase para gerenciar avaliações reais." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  const query = supabase!.from("reviews").delete().eq("professional_id", id);
  const { error } = await (isAdmin ? query : query.eq("reviewer_id", user.id));

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
