import "server-only";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

/** true quando a chave do Mercado Pago está configurada no ambiente. */
export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

function getClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken });
}

/**
 * Cria uma cobrança Pix no Mercado Pago para um depósito na carteira.
 * `depositId` vira o `external_reference` do pagamento, usado para
 * correlacionar a confirmação (webhook ou verificação manual) com a linha
 * em wallet_deposits.
 */
export async function createPixPayment(params: {
  depositId: string;
  amountCents: number;
  payerEmail: string;
  description: string;
}) {
  const client = getClient();
  if (!client) throw new Error("Mercado Pago não está configurado (MERCADO_PAGO_ACCESS_TOKEN ausente).");

  const payment = new Payment(client);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const result = await payment.create({
    body: {
      transaction_amount: Math.round(params.amountCents) / 100,
      description: params.description,
      payment_method_id: "pix",
      payer: { email: params.payerEmail },
      external_reference: params.depositId,
      notification_url: `${siteUrl}/api/wallet/webhook`,
    },
  });

  const txData = result.point_of_interaction?.transaction_data;

  return {
    mpPaymentId: String(result.id),
    status: result.status,
    qrCode: txData?.qr_code ?? null,
    qrCodeBase64: txData?.qr_code_base64 ?? null,
  };
}

/**
 * Busca o status real de um pagamento direto na API do Mercado Pago —
 * nunca confiamos apenas no corpo do webhook, que pode ser forjado por
 * terceiros. Só depois de confirmar `status === "approved"` aqui é que
 * creditamos a carteira.
 */
export async function fetchPaymentStatus(mpPaymentId: string) {
  const client = getClient();
  if (!client) throw new Error("Mercado Pago não está configurado.");

  const payment = new Payment(client);
  const result = await payment.get({ id: mpPaymentId });
  return result.status;
}

/**
 * Busca no Mercado Pago um pagamento pelo `external_reference` (o id do
 * depósito). Usado como recuperação quando `mp_payment_id` não foi salvo em
 * wallet_deposits (ex.: falha ao persistir logo após a criação da cobrança).
 */
export async function findPaymentByDepositId(depositId: string): Promise<string | null> {
  const client = getClient();
  if (!client) throw new Error("Mercado Pago não está configurado.");

  const payment = new Payment(client);
  const result = await payment.search({
    options: { external_reference: depositId, sort: "date_created", criteria: "desc" },
  });
  const found = result.results?.[0];
  return found?.id ? String(found.id) : null;
}

/**
 * Confirma (via API do Mercado Pago) e credita um depósito pendente.
 * Idempotente — pode ser chamada várias vezes (webhook + polling do
 * cliente) sem creditar duas vezes, graças a credit_wallet_deposit() no
 * banco. Retorna o novo status do depósito.
 */
export async function verifyAndCreditDeposit(depositId: string): Promise<"approved" | "pending" | "rejected"> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Service role do Supabase não configurada.");

  const { data: deposit } = await admin
    .from("wallet_deposits")
    .select("id, status, mp_payment_id")
    .eq("id", depositId)
    .single();

  if (!deposit) throw new Error("Depósito não encontrado.");
  if (deposit.status === "approved") return "approved";

  let mpPaymentId = deposit.mp_payment_id;

  if (!mpPaymentId) {
    // A cobrança foi criada no Mercado Pago mas o id não ficou salvo no
    // depósito (ex.: falha silenciosa ao persistir). Recupera pelo
    // external_reference antes de desistir.
    mpPaymentId = await findPaymentByDepositId(depositId);
    if (!mpPaymentId) return "pending";
    await admin.from("wallet_deposits").update({ mp_payment_id: mpPaymentId, updated_at: new Date().toISOString() }).eq("id", depositId);
  }

  const mpStatus = await fetchPaymentStatus(mpPaymentId);

  if (mpStatus === "approved") {
    const { error } = await admin.rpc("credit_wallet_deposit", { p_deposit_id: depositId });
    if (error) throw new Error(error.message);
    return "approved";
  }

  if (mpStatus === "rejected" || mpStatus === "cancelled") {
    await admin.from("wallet_deposits").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", depositId);
    return "rejected";
  }

  return "pending";
}
