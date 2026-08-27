import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Modo demonstração: configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar cadastro real. Veja o README.",
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
