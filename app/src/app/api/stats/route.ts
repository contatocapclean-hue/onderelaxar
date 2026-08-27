import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

const ALLOWED_FIELDS = new Set(["views", "whatsapp_clicks", "contact_clicks"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const professionalId = body?.professionalId as string | undefined;
  const field = body?.field as string | undefined;

  if (!professionalId || !field || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    // Modo demo: não há banco real para gravar a métrica.
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createClient();
  const { error } = await supabase!.rpc("increment_profile_stat", {
    p_professional_id: professionalId,
    p_field: field,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
