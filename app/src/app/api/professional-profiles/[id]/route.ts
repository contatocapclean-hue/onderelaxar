import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

interface Params {
  params: Promise<{ id: string }>;
}

async function assertOwnerOrAdmin(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return { supabase, ok: false as const };

  const { data: profile } = await supabase!
    .from("professional_profiles")
    .select("user_id")
    .eq("id", id)
    .single();

  const { data: userProfile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "super_admin";

  return { supabase, ok: profile?.user_id === user.id || isAdmin, isAdmin };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Modo demonstração: configure o Supabase para salvar alterações reais." },
      { status: 400 }
    );
  }

  const { supabase, ok } = await assertOwnerOrAdmin(id);
  if (!ok) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const body = await request.json();
  const {
    professionalName,
    description,
    cityId,
    neighborhood,
    attendanceType,
    venueName,
    venueAddress,
    categoryIds,
    photos,
    contact,
    coverPhoto,
  } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (professionalName !== undefined) updates.professional_name = professionalName;
  if (description !== undefined) updates.description = description;
  if (cityId !== undefined) updates.city_id = cityId;
  if (neighborhood !== undefined) updates.neighborhood = neighborhood;
  if (attendanceType !== undefined) updates.attendance_type = attendanceType;
  if (venueName !== undefined) updates.venue_name = venueName || null;
  if (venueAddress !== undefined) updates.venue_address = venueAddress || null;
  if (coverPhoto !== undefined) updates.cover_photo = coverPhoto || null;

  const { error } = await supabase!.from("professional_profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (categoryIds !== undefined) {
    await supabase!.from("professional_services").delete().eq("professional_id", id);
    if (categoryIds.length) {
      await supabase!
        .from("professional_services")
        .insert(categoryIds.map((categoryId: string) => ({ professional_id: id, category_id: categoryId })));
    }
  }

  if (photos !== undefined) {
    // Defesa extra contra fotos duplicadas: mesmo que o cliente envie a
    // mesma URL mais de uma vez (ex.: um bug reconstruindo a lista a
    // partir de profile_photo + galeria), nunca gravamos duas linhas com
    // a mesma imagem para o mesmo profissional.
    const seenUrls = new Set<string>();
    const dedupedPhotos = (photos as { url: string; kind: string; order: number }[]).filter((p) => {
      if (seenUrls.has(p.url)) return false;
      seenUrls.add(p.url);
      return true;
    });

    await supabase!.from("photos").delete().eq("professional_id", id);
    if (dedupedPhotos.length) {
      await supabase!.from("photos").insert(
        dedupedPhotos.map((p, i) => ({
          professional_id: id,
          image_url: p.url,
          kind: p.kind,
          sort_order: i,
        }))
      );
      await supabase!.from("professional_profiles").update({ profile_photo: dedupedPhotos[0].url }).eq("id", id);
    }
  }

  if (contact !== undefined) {
    // WhatsApp é o canal de contato principal da plataforma e sempre fica
    // público — forçado aqui no servidor (não só no formulário) pra não dar
    // pra esconder chamando a API diretamente.
    await supabase!
      .from("contact_info")
      .upsert({ professional_id: id, ...contact, whatsapp_visibility: "public" });
  }

  return NextResponse.json({ ok: true });
}
