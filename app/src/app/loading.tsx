// Skeleton da home enquanto os dados (destaques, cidades, categorias, etc.)
// carregam no servidor. Sem isso a página ficava em branco (ou com o layout
// anterior congelado) durante esse tempo — o Next já mostra este arquivo
// automaticamente via Suspense enquanto o page.tsx não resolve.
export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-b from-beige-soft to-background">
        <div className="container-page flex flex-col items-center gap-4 pb-10 pt-10 text-center sm:pb-14">
          <div className="h-10 w-full max-w-xl rounded bg-beige-soft sm:h-12" />
          <div className="h-6 w-56 rounded-full bg-beige-soft" />
          <div className="h-12 w-full max-w-2xl rounded-full bg-beige-soft" />
        </div>
      </div>

      <section className="bg-beige-soft pb-16 pt-10 sm:pb-20 sm:pt-12">
        <div className="container-page">
          <div className="mb-8 h-8 w-56 rounded bg-surface" />
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
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="mb-8 h-8 w-64 rounded bg-beige-soft" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-md)] border border-border bg-surface p-3">
              <div className="aspect-square w-full rounded-[var(--radius-sm)] bg-beige-soft" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
