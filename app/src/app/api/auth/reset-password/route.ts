import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Modo demonstração: configure o Supabase para habilitar recuperação de senha real." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase!.auth.resetPasswordForEmail(email, {
    redirectTo: `${request.nextUrl.origin}/painel`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
