export default function PainelLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-48 rounded bg-beige-soft" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius-md)] border border-border bg-surface p-5" />
        ))}
      </div>
      <div className="mt-4 h-28 rounded-[var(--radius-md)] border border-border bg-surface p-5" />
    </div>
  );
}
