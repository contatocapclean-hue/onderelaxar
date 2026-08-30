"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/mock-data";
import type { ProfessionalProfile, WalletTransaction } from "@/lib/types";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TRANSACTION_LABEL: Record<string, string> = {
  deposit: "Depósito via Pix",
  featured_purchase: "Destaque do perfil",
  story_purchase: "Story publicado",
  refund: "Estorno",
};

const DEPOSIT_PRESETS_CENTS = [2000, 5000, 10000];

const PENDING_POLL_INTERVAL_MS = 4000;
const PENDING_POLL_TIMEOUT_MS = 3 * 60 * 1000;

export function CarteiraForm({
  profile,
  transactions,
}: {
  profile: ProfessionalProfile;
  transactions: WalletTransaction[];
}) {
  const router = useRouter();
  const demo = !isSupabaseConfigured();

  // ---------------------------------------------------------------------
  // Depósito via Pix
  // ---------------------------------------------------------------------
  const [depositAmount, setDepositAmount] = useState(2000);
  const [depositAmountInput, setDepositAmountInput] = useState("20,00");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ depositId: string; qrCode: string | null; qrCodeBase64: string | null } | null>(
    null
  );
  const [depositStatus, setDepositStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleGeneratePix() {
    setDepositError(null);
    if (demo) {
      setDepositError("Modo demonstração: configure o Supabase e o Mercado Pago para depositar de verdade.");
      return;
    }
    setDepositLoading(true);
    const res = await fetch("/api/wallet/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: depositAmount }),
    });
    const data = await res.json();
    setDepositLoading(false);
    if (!res.ok) {
      setDepositError(data.error ?? "Erro ao gerar cobrança Pix.");
      return;
    }
    setPix({ depositId: data.depositId, qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
    setDepositStatus("pending");
  }

  useEffect(() => {
    if (!pix || depositStatus !== "pending") return;

    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > PENDING_POLL_TIMEOUT_MS) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      const res = await fetch(`/api/wallet/deposits/${pix.depositId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "approved") {
        setDepositStatus("approved");
        if (pollRef.current) clearInterval(pollRef.current);
        router.refresh();
      } else if (data.status === "rejected") {
        setDepositStatus("rejected");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, PENDING_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix, depositStatus]);

  async function handleCopy() {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      {demo && (
        <div className="rounded-[var(--radius-md)] bg-primary/5 p-3 text-xs text-primary">
          Modo demonstração — configure o Supabase e o Mercado Pago para usar a carteira de verdade.
        </div>
      )}

      {/* Saldo */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <p className="text-sm text-muted-foreground">Saldo disponível</p>
        <p className="font-display mt-1 text-3xl text-foreground">{formatCents(profile.walletBalanceCents)}</p>
      </div>

      {/* Depositar */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <p className="mb-4 font-medium text-foreground">Depositar via Pix</p>

        {!pix && (
          <>
            <div className="flex flex-wrap gap-2">
              {DEPOSIT_PRESETS_CENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setDepositAmount(c);
                    setDepositAmountInput((c / 100).toFixed(2).replace(".", ","));
                  }}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    depositAmount === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-beige-soft"
                  }`}
                >
                  {formatCents(c)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Outro valor:</span>
              <input
                type="text"
                inputMode="decimal"
                value={depositAmountInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Aceita dígitos e vírgula/ponto como separador decimal (até 2 casas).
                  if (!/^\d*[.,]?\d{0,2}$/.test(raw)) return;
                  setDepositAmountInput(raw);
                  const normalized = Number(raw.replace(",", "."));
                  if (Number.isFinite(normalized)) {
                    setDepositAmount(Math.round(normalized * 100));
                  }
                }}
                onBlur={() => {
                  setDepositAmountInput((depositAmount / 100).toFixed(2).replace(".", ","));
                }}
                placeholder="0,00"
                className="w-28 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm"
              />
            </div>
            {depositError && <p className="mt-3 text-sm text-red-600">{depositError}</p>}
            <button
              onClick={handleGeneratePix}
              disabled={depositLoading}
              className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {depositLoading ? "Gerando cobrança…" : "Gerar Pix"}
            </button>
          </>
        )}

        {pix && depositStatus === "pending" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR code ou copie o código Pix para pagar {formatCents(depositAmount)}.
            </p>
            {pix.qrCodeBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR code Pix"
                className="h-56 w-56 rounded-[var(--radius-md)] border border-border"
              />
            )}
            {pix.qrCode && (
              <button
                onClick={handleCopy}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft"
              >
                {copied ? "Copiado!" : "Copiar código Pix"}
              </button>
            )}
            <p className="text-xs text-muted-foreground">Aguardando confirmação do pagamento…</p>
            <button
              onClick={() => {
                setPix(null);
                setDepositStatus(null);
              }}
              className="text-xs text-muted-foreground underline"
            >
              Cancelar e voltar
            </button>
          </div>
        )}

        {depositStatus === "approved" && (
          <div className="text-center">
            <p className="text-sm font-medium text-green-700">Pagamento confirmado! Saldo atualizado.</p>
            <button
              onClick={() => {
                setPix(null);
                setDepositStatus(null);
              }}
              className="mt-3 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft"
            >
              Fazer novo depósito
            </button>
          </div>
        )}

        {depositStatus === "rejected" && (
          <div className="text-center">
            <p className="text-sm text-red-600">Pagamento não aprovado. Tente novamente.</p>
            <button
              onClick={() => {
                setPix(null);
                setDepositStatus(null);
              }}
              className="mt-3 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-beige-soft"
            >
              Tentar de novo
            </button>
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 card-shadow">
        <p className="mb-4 font-medium text-foreground">Histórico</p>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-foreground">{TRANSACTION_LABEL[t.type] ?? t.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={t.amountCents >= 0 ? "font-medium text-green-700" : "font-medium text-foreground/80"}>
                  {t.amountCents >= 0 ? "+" : ""}
                  {formatCents(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
