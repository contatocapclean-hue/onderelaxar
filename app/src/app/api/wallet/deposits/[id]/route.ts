import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/mock-data";
import { verifyAndCreditDeposit, isMercadoPagoConfigured } from "@/lib/mercadopago";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Consultado pelo painel enquanto o QR code Pix está na tela. Serve como
 * rede de segurança caso o webhook do Mercado Pago demore ou nunca chegue:
 * a cada consulta, se o depósito ainda estiver pendente, verificamos o
 * status real direto na API do Mercado Pago antes de responder.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Modo demonstração." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  // A política de RLS "wallet_deposits: owner or admin read" já garante que
  // só o dono do depósito (ou um admin) recebe a linha aqui.
  const { data: deposit } = await supabase!
    .from("wallet_deposits")
    .select("id, status, amount_cents")
    .eq("id", id)
    .single();

  if (!deposit) return NextResponse.json({ error: "Depósito não encontrado." }, { status: 404 });

  let status = deposit.status as string;

  if (status === "pending" && isMercadoPagoConfigured()) {
    try {
      status = await verifyAndCreditDeposit(id);
    } catch {
      // se a verificação falhar (ex: instabilidade da API do Mercado Pago),
      // simplesmente devolvemos o status atual e o cliente tenta de novo.
    }
  }

  return NextResponse.json({ status, amountCents: deposit.amount_cents });
}
