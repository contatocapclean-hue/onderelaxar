import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/mock-data";
import { createPixPayment, isMercadoPagoConfigured } from "@/lib/mercadopago";

const MIN_DEPOSIT_CENTS = 500; // R$ 5,00
const MAX_DEPOSIT_CENTS = 100000; // R$ 1.000,00

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Modo demonstração: configure o Supabase e o Mercado Pago para depositar de verdade." },
      { status: 400 }
    );
  }
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: "Pagamentos ainda não configurados. Tente novamente mais tarde." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 });

  const body = await request.json();
  const amountCents = Math.round(Number(body.amountCents));

  if (!Number.isFinite(amountCents) || amountCents < MIN_DEPOSIT_CENTS || amountCents > MAX_DEPOSIT_CENTS) {
    return NextResponse.json(
      { error: `Informe um valor entre R$ ${(MIN_DEPOSIT_CENTS / 100).toFixed(2)} e R$ ${(MAX_DEPOSIT_CENTS / 100).toFixed(2)}.` },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase!
    .from("professional_profiles")
    .select("id, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Perfil profissional não encontrado." }, { status: 404 });

  const { data: deposit, error: insertError } = await supabase!
    .from("wallet_deposits")
    .insert({ professional_id: profile.id, amount_cents: amountCents, status: "pending" })
    .select("id")
    .single();

  if (insertError || !deposit) {
    return NextResponse.json({ error: insertError?.message ?? "Erro ao criar depósito." }, { status: 400 });
  }

  try {
    const pix = await createPixPayment({
      depositId: deposit.id,
      amountCents,
      payerEmail: user.email ?? "sem-email@onderelaxar.com.br",
      description: "Depósito na carteira Onde Relaxar",
    });

    // Usa o client com service_role: a policy de UPDATE de wallet_deposits
    // não libera o dono da linha (só admin/service_role), então o client
    // autenticado do usuário falharia silenciosamente aqui (0 linhas
    // afetadas, sem erro) e o pagamento ficaria "pending" para sempre.
    const admin = createAdminClient();
    if (admin) {
      await admin
        .from("wallet_deposits")
        .update({
          mp_payment_id: pix.mpPaymentId,
          qr_code: pix.qrCode,
          qr_code_base64: pix.qrCodeBase64,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);
    }

    return NextResponse.json({
      depositId: deposit.id,
      amountCents,
      qrCode: pix.qrCode,
      qrCodeBase64: pix.qrCodeBase64,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar cobrança Pix." },
      { status: 502 }
    );
  }
}
