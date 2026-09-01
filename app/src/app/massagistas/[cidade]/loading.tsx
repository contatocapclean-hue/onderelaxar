// Skeleton da listagem por cidade enquanto os profissionais e filtros
// carregam no servidor (a busca por cidade pode levar um instante a mais
// que a home, já que também aplica os filtros vindos da URL).
export default function CidadeLoading() {
  return (
    <div className="container-page animate-pulse py-10">
      <div className="mb-6 space-y-2">
        <div className="h-9 w-72 rounded bg-beige-soft sm:h-10" />
        <div className="h-4 w-40 rounded bg-beige-soft" />
      </div>

      <div className="mb-8 h-12 w-full rounded-[var(--radius-md)] bg-beige-soft" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            <div className="aspect-[4/5] w-full bg-beige-soft" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 rounded bg-beige-soft" />
              <div className="h-3 w-1/2 rounded bg-beige-soft" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
