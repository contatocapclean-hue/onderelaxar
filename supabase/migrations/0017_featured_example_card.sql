-- ============================================================================
-- Card de exemplo do destaque: configurado pelo admin (super_admin) em
-- Configurações do site, exibido no painel de todas as profissionais junto
-- do botão "Ativar destaque" para elas visualizarem como o próprio perfil
-- vai ficar caso paguem pelo destaque — sem tornar ninguém destaque de
-- verdade e sem depender de um perfil real.
-- ============================================================================

alter table public.site_settings
  add column if not exists featured_example_name text,
  add column if not exists featured_example_city_label text,
  add column if not exists featured_example_photo_url text,
  add column if not exists featured_example_updated_at timestamptz;

-- Sem alteração de RLS: a policy "site_settings: admin update" já existente
-- (migration 0003) cobre update de qualquer coluna da linha única, e a rota
-- da API que grava esses campos (/api/admin/settings) já restringe a ação
-- ao super_admin.
