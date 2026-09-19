import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { MOCK_PENDING_PROFESSIONALS, MOCK_PROFESSIONALS, isSupabaseConfigured } from "@/lib/mock-data";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Fotos de um perfil para moderação pelo admin (inclusive o master): não é
 * a mesma tela da profissional (fotos-form.tsx), é uma versão só de
 * consulta + remoção, para tirar uma foto indevida publicada depois que o
 * perfil já foi aprovado, sem depender da profissional fazer isso sozinha.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const profile = [...MOCK_PENDING_PROFESSIONALS, ...MOCK_PROFESSIONALS].find((p) => p.id === id);
    if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    return NextResponse.json({
      professionalName: profile.professionalName,
      coverPhoto: profile.coverPhoto,
      photos: profile.photos,
    });
  }

  const result = await requireAdmin();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { data, error } = await result.supabase
    .from("professional_profiles")
    .select("professional_name, cover_photo, photos ( id, image_url, kind, sort_order )")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Perfil não encontrado." }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photos = ((data as any).photos ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({ id: p.id, url: p.image_url, kind: p.kind, order: p.sort_order }));

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    professionalName: (data as any).professional_name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coverPhoto: (data as any).cover_photo,
    photos,
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireAdmin();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const { supabase } = result;

  const body = await request.json().catch(() => ({}));
  const { photoId, target } = body as { photoId?: string; target?: "cover" };

  if (target === "cover") {
    const { error } = await supabase.from("professional_profiles").update({ cover_photo: null }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (!photoId) return NextResponse.json({ error: "Informe a foto a remover." }, { status: 400 });

  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("professional_id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  // Mesma lógica do painel da profissional: profile_photo é só um "cache"
  // da primeira foto da galeria, então precisa ser recalculado depois de
  // remover — senão a foto apagada "ressuscita" como avatar.
  const { data: remaining } = await supabase
    .from("photos")
    .select("image_url, sort_order")
    .eq("professional_id", id)
    .order("sort_order", { ascending: true });

  await supabase
    .from("professional_profiles")
    .update({ profile_photo: remaining?.[0]?.image_url ?? null })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
