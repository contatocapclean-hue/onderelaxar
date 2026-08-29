export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-48 rounded bg-beige-soft" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius-md)] border border-border bg-surface p-5" />
        ))}
      </div>
    </div>
  );
}
