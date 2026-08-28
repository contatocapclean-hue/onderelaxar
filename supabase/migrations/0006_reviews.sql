-- ============================================================================
-- Avaliações (reviews) de profissionais
-- ============================================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, reviewer_id)
);

create index if not exists idx_reviews_professional on public.reviews(professional_id);

alter table public.reviews enable row level security;

-- leitura pública: as avaliações só são exibidas nas páginas de perfil,
-- que já controlam quando um perfil (publicado ou não) pode ser aberto
create policy "reviews: public read" on public.reviews
  for select using (true);

-- só o próprio usuário autenticado pode criar uma avaliação em seu nome
create policy "reviews: authenticated create own" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- só o autor pode editar sua própria avaliação
create policy "reviews: owner updates own" on public.reviews
  for update using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

-- o autor ou um admin podem excluir a avaliação
create policy "reviews: owner or admin deletes" on public.reviews
  for delete using (auth.uid() = reviewer_id or public.is_admin());
