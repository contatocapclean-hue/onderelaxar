// Skeleton do perfil enquanto os dados do profissional, reviews e usuário
// logado carregam no servidor. Segue a mesma estrutura de profile-view.tsx
// (capa, avatar, nome, cards de estatística, galeria, texto) para que a
// troca do skeleton pelo conteúdo real não "pule" o layout.
export default function PerfilLoading() {
  return (
    <div className="container-page animate-pulse py-6 sm:py-10">
      <div className="mx-auto max-w-3xl pb-24 sm:pb-10">
        <div className="relative -mx-5 aspect-[21/5] w-[calc(100%+2.5rem)] overflow-hidden bg-beige-soft sm:mx-0 sm:w-full sm:rounded-[var(--radius-lg)]" />

        <div className="flex items-end gap-4 px-1 sm:px-0">
          <div className="relative -mt-12 h-24 w-24 shrink-0 rounded-full border-4 border-background bg-beige-soft sm:-mt-14 sm:h-28 sm:w-28" />
          <div className="mt-3 min-w-0 flex-1 space-y-2">
            <div className="h-7 w-48 rounded bg-beige-soft" />
            <div className="h-4 w-32 rounded bg-beige-soft" />
          </div>
        </div>

        <div className="mx-1 mt-4 grid grid-cols-1 gap-3 sm:mx-0 sm:grid-cols-2">
          <div className="h-20 rounded-[var(--radius-md)] border border-border bg-surface" />
          <div className="h-20 rounded-[var(--radius-md)] border border-border bg-surface" />
        </div>

        <div className="mx-1 mt-8 sm:mx-0">
          <div className="mb-3 h-5 w-32 rounded bg-beige-soft" />
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-[2/3] w-full rounded-[var(--radius-lg)] bg-beige-soft" />
            <div className="aspect-[2/3] w-full rounded-[var(--radius-lg)] bg-beige-soft" />
          </div>
        </div>

        <div className="mx-1 mt-8 space-y-2 sm:mx-0">
          <div className="h-5 w-40 rounded bg-beige-soft" />
          <div className="h-4 w-full rounded bg-beige-soft" />
          <div className="h-4 w-5/6 rounded bg-beige-soft" />
          <div className="h-4 w-2/3 rounded bg-beige-soft" />
        </div>
      </div>
    </div>
  );
}
