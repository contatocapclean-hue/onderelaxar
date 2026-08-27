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

  const { error } = await supabase!
    .from("reports")
    .insert({ professional_id: professionalId, reporter_id: user?.id ?? null, reason });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
