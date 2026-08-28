import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAndCreditDeposit, isMercadoPagoConfigured } from "@/lib/mercadopago";

/**
 * Webhook do Mercado Pago (configurado automaticamente via `notification_url`
 * em cada cobrança Pix criada). Não confiamos no conteúdo do payload em si
 * — ele só nos diz "algo mudou no pagamento X"; a confirmação real do
 * status acontece em verifyAndCreditDeposit(), que consulta a API do
 * Mercado Pago diretamente antes de creditar qualquer saldo.
 *
 * Sempre respondemos 200 rapidamente (mesmo em erros de negócio) para que
 * o Mercado Pago não fique reenviando o mesmo evento indefinidamente; o
 * polling em /api/wallet/deposits/[id] é a rede de segurança caso este
 * webhook falhe silenciosamente.
 */
export async function POST(request: NextRequest) {
  if (!isMercadoPagoConfigured()) return NextResponse.json({ ok: true });

  let paymentId: string | null = null;

  try {
    const url = new URL(request.url);
    paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");

    if (!paymentId) {
      const body = await request.json().catch(() => null);
      const type = body?.type ?? body?.topic;
      if (type === "payment" && body?.data?.id) {
        paymentId = String(body.data.id);
      }
    }
  } catch {
    // payload inesperado — ignoramos
  }

  if (!paymentId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true });

  const { data: deposit } = await admin
    .from("wallet_deposits")
    .select("id")
    .eq("mp_payment_id", paymentId)
    .maybeSingle();

  if (!deposit) return NextResponse.json({ ok: true });

  try {
    await verifyAndCreditDeposit(deposit.id);
  } catch {
    // erro será resolvido no próximo polling do cliente ou reenvio do webhook
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
