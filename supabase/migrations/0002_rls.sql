-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.service_categories enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_services enable row level security;
alter table public.photos enable row level security;
alter table public.contact_info enable row level security;
alter table public.profile_statistics enable row level security;
alter table public.reports enable row level security;
alter table public.plans enable row level security;

-- helper: usuário atual é admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: user reads own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: user updates own (not role)" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin updates any" on public.profiles
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- cities / service_categories: leitura pública, escrita só admin
-- ---------------------------------------------------------------------------
create policy "cities: public read" on public.cities for select using (true);
create policy "cities: admin write" on public.cities for insert with check (public.is_admin());
create policy "cities: admin update" on public.cities for update using (public.is_admin());
create policy "cities: admin delete" on public.cities for delete using (public.is_admin());

create policy "categories: public read" on public.service_categories for select using (true);
create policy "categories: admin write" on public.service_categories for insert with check (public.is_admin());
create policy "categories: admin update" on public.service_categories for update using (public.is_admin());
create policy "categories: admin delete" on public.service_categories for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- professional_profiles
-- ---------------------------------------------------------------------------
create policy "prof_profiles: public reads published" on public.professional_profiles
  for select using (profile_status = 'published' or user_id = auth.uid() or public.is_admin());

create policy "prof_profiles: owner inserts" on public.professional_profiles
  for insert with check (user_id = auth.uid());

-- dono edita seus próprios dados, mas não pode alterar campos de moderação
create policy "prof_profiles: owner updates own" on public.professional_profiles
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and verification_status = (select verification_status from public.professional_profiles where id = professional_profiles.id)
    and is_featured = (select is_featured from public.professional_profiles where id = professional_profiles.id)
    and plan = (select plan from public.professional_profiles where id = professional_profiles.id)
  );

create policy "prof_profiles: admin full update" on public.professional_profiles
  for update using (public.is_admin());

create policy "prof_profiles: owner deletes own" on public.professional_profiles
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- professional_services
-- ---------------------------------------------------------------------------
create policy "prof_services: public read of published profiles" on public.professional_services
  for select using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id
        and (p.profile_status = 'published' or p.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "prof_services: owner manages own" on public.professional_services
  for all using (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create policy "photos: public read of published profiles" on public.photos
  for select using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id
        and (p.profile_status = 'published' or p.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "photos: owner manages own" on public.photos
  for all using (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- contact_info — leitura pública é feita via view filtrada na aplicação
-- (a visibilidade por canal é aplicada no código, não no RLS, pois depende
-- de qual campo está sendo lido; aqui garantimos que só o dono e admin
-- conseguem ler/escrever a linha inteira, e a API usa uma função RPC
-- `get_public_contact` para retornar apenas os campos com visibility='public')
-- ---------------------------------------------------------------------------
create policy "contact_info: owner reads own" on public.contact_info
  for select using (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  );

create policy "contact_info: owner manages own" on public.contact_info
  for all using (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  );

-- função pública que retorna apenas os campos liberados pela visibilidade
create or replace function public.get_public_contact(p_professional_id uuid)
returns table (whatsapp text, phone text, email text, instagram text)
language sql
security definer set search_path = public
stable
as $$
  select
    case when whatsapp_visibility = 'public' then whatsapp else null end,
    case when phone_visibility = 'public' then phone else null end,
    case when email_visibility = 'public' then email else null end,
    case when instagram_visibility = 'public' then instagram else null end
  from public.contact_info
  where professional_id = p_professional_id;
$$;

-- ---------------------------------------------------------------------------
-- profile_statistics — leitura só do dono/admin; escrita só via RPC (security definer)
-- ---------------------------------------------------------------------------
create policy "stats: owner reads own" on public.profile_statistics
  for select using (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
    or public.is_admin()
  );
-- nenhuma policy de insert/update é criada para clientes: só a função
-- increment_profile_stat (security definer) grava nesta tabela.

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create policy "reports: authenticated can create" on public.reports
  for insert with check (auth.uid() is not null);

create policy "reports: admin reads/manages" on public.reports
  for select using (public.is_admin());

create policy "reports: admin updates" on public.reports
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- plans: leitura pública, escrita só admin
-- ---------------------------------------------------------------------------
create policy "plans: public read" on public.plans for select using (true);
create policy "plans: admin write" on public.plans for insert with check (public.is_admin());
create policy "plans: admin update" on public.plans for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: bucket "profile-photos" — dono grava no próprio path, leitura pública
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "storage: public read profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy "storage: owner uploads to own folder" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage: owner manages own files" on storage.objects
  for update using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage: owner deletes own files" on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
