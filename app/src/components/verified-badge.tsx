export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold ${className}`}
      style={{ color: "var(--color-gold)", backgroundColor: "color-mix(in srgb, var(--color-gold) 12%, transparent)" }}
      title="Perfil verificado"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M10 1.5l2.2 1.6 2.7-.2 1 2.5 2.4 1.3-.5 2.7 1.2 2.4-1.9 2 .3 2.7-2.6.8-1.4 2.3-2.7-.6-2.4 1.2-1.9-2-2.7-.3-.4-2.7-2.4-1.3.6-2.6-1.4-2.3 1.9-2-.2-2.7 2.6-.9L7.8 3.1 10 1.5z"
          clipRule="evenodd"
        />
        <path d="M8.6 12.9L6.4 10.7l1-1 1.2 1.2 3.1-3.1 1 1z" fill="var(--color-beige-soft)" />
      </svg>
      Verificado
    </span>
  );
}
