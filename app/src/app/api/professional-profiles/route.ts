import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Modo demonstração: conecte um projeto Supabase (veja o README) para publicar perfis de verdade. Você já pode navegar por todo o fluxo do formulário.",
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });
  }

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
    photos, // array of { url, kind, order }
    contact, // { whatsapp, phone, email, instagram, *_visibility }
    publish, // boolean — false = salvar como rascunho
  } = body;

  const slug = `${slugify(professionalName)}-${user.id.slice(0, 6)}`;

  const { data: profile, error: profileError } = await supabase!
    .from("professional_profiles")
    .insert({
      user_id: user.id,
      professional_name: professionalName,
      slug,
      description,
      city_id: cityId,
      neighborhood,
      attendance_type: attendanceType,
      venue_name: venueName || null,
      venue_address: venueAddress || null,
      profile_photo: photos?.[0]?.url ?? null,
      profile_status: publish ? "pending_review" : "draft",
    })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (categoryIds?.length) {
    await supabase!
      .from("professional_services")
      .insert(categoryIds.map((categoryId: string) => ({ professional_id: profile.id, category_id: categoryId })));
  }

  if (photos?.length) {
    await supabase!.from("photos").insert(
      photos.map((p: { url: string; kind: string; order: number }) => ({
        professional_id: profile.id,
        image_url: p.url,
        kind: p.kind,
        sort_order: p.order,
      }))
    );
  }

  if (contact) {
    // WhatsApp é o canal de contato principal da plataforma e sempre fica
    // público — forçado aqui no servidor (não só no formulário) pra não dar
    // pra esconder chamando a API diretamente.
    await supabase!
      .from("contact_info")
      .insert({ professional_id: profile.id, ...contact, whatsapp_visibility: "public" });
  }

  return NextResponse.json({ ok: true, slug: profile.slug, status: profile.profile_status });
}
