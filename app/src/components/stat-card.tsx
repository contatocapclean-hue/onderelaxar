import { formatNumber } from "@/lib/utils";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 card-shadow">
      <p className="font-display text-3xl text-foreground">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
