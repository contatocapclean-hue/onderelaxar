-- ============================================================================
-- site_settings deve ser editável apenas pelo administrador master
-- (super_admin), mesmo em acesso direto via API/RLS — não só na UI.
-- ============================================================================

create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

drop policy if exists "site_settings: admin update" on public.site_settings;

create policy "site_settings: super_admin update" on public.site_settings
  for update using (public.is_super_admin())
  with check (id = 1);
