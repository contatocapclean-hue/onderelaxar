-- ============================================================================
-- site_settings: textos editáveis da home/rodapé, controlados pelo admin
-- ============================================================================

create table if not exists public.site_settings (
  id smallint primary key default 1,
  hero_badge text not null default 'Divulgação 100% gratuita para profissionais',
  hero_title text not null default 'Encontre profissionais de massagem perto de você',
  hero_subtitle text not null default 'Descubra profissionais, conheça seus serviços e encontre a opção ideal para o seu momento de relaxamento e bem-estar.',
  cta_title text not null default 'É profissional de massagem? Divulgue seu trabalho gratuitamente.',
  cta_subtitle text not null default 'Crie seu perfil em poucos minutos e comece a ser encontrado por clientes na sua cidade.',
  footer_description text not null default 'Diretório de profissionais de massagem. Divulgação gratuita, feita para conectar bem-estar e confiança.',
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "site_settings: public read" on public.site_settings
  for select using (true);

create policy "site_settings: admin update" on public.site_settings
  for update using (public.is_admin())
  with check (id = 1);

-- sem policies de insert/delete: a linha única já existe (seed acima) e o
-- admin só pode atualizá-la, nunca criar outras linhas ou apagar a existente.
