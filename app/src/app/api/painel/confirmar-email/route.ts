import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";

/**
 * Dispara um magic link pro próprio e-mail da pessoa autenticada, só pra
 * confirmar que ela realmente tem acesso a essa caixa de entrada — usado
 * como pré-requisito extra pro selo de verificado (ver migração 0014).
 * Não depende do toggle "Confirm email" do Supabase Auth (que está
 * desligado, pra manter o cadastro sem fricção): signInWithOtp sempre
 * manda e-mail, mesmo com confirmação de cadastro desativada.
 *
 * O e-mail é lido do lado do servidor via supabase.auth.getUser() — nunca
 * aceito do corpo da requisição — pra pessoa não conseguir mandar o link
 * de confirmação pro e-mail de outra pessoa.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Modo demonstração." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { origin } = new URL(request.url);
  const { error } = await supabase!.auth.signInWithOtp({
    email: user.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/painel/verificacao`,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail agora. Tente novamente." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
