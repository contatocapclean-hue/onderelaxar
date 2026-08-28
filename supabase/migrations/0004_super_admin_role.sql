-- ============================================================================
-- super_admin: administrador master, único com acesso a
-- "Configurações do site" (/admin/configuracoes). Admins comuns continuam
-- com todo o resto do acesso administrativo (perfis, usuários, cidades,
-- categorias, denúncias).
-- ============================================================================

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'super_admin'));

-- is_admin() continua valendo para admin comum E super_admin — nenhuma
-- policy de RLS muda de comportamento com esta migração.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- Promove a conta dona do site ao papel de administrador master.
update public.profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'cleitonap88@gmail.com');
