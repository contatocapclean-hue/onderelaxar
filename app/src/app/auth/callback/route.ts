import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota para onde o link do e-mail de confirmação de cadastro (ou o magic
 * link de "confirmar e-mail" da tela de verificação) aponta. O Supabase
 * processa o token e redireciona o navegador pra cá com "?code=..." — aqui
 * trocamos esse código pela sessão do usuário (fluxo PKCE do @supabase/ssr)
 * e seguimos o cadastro (ou voltamos pra tela de onde vier o "next").
 *
 * Também marcamos aqui o e-mail como confirmado em professional_profiles
 * (pré-requisito extra pro selo de verificado — ver migração 0014):
 * chegar até aqui com um "code" válido só é possível depois de a pessoa
 * ter clicado num link que o Supabase realmente enviou pro e-mail
 * cadastrado, então é prova legítima de posse do e-mail. A chamada é
 * melhor-esforço — se a pessoa ainda não tem perfil profissional (por
 * exemplo, é cliente), a função no banco simplesmente não encontra nada
 * pra atualizar.
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
        await supabase.rpc("confirm_profile_email");
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
}
