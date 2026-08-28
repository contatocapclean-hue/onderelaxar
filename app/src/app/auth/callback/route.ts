import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota para onde o link do e-mail de confirmação de cadastro aponta
 * (emailRedirectTo no signUp/resend). O Supabase processa o token e
 * redireciona o navegador pra cá com "?code=..." — aqui trocamos esse
 * código pela sessão do usuário (fluxo PKCE do @supabase/ssr) e seguimos
 * o cadastro.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cadastro/objetivo";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
}
