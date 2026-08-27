import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Modo demonstração: configure o Supabase para habilitar login real. Veja o README para conectar seu projeto.",
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase!.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
