-- ============================================================================
-- Story do sistema: um story fixo, publicado pelo administrador master
-- (super_admin), que aparece sempre primeiro na barra de stories da home,
-- sem depender de um profissional nem expirar em 24h como os stories pagos.
-- ============================================================================

alter table public.site_settings
  add column if not exists system_story_media_url text,
  add column if not exists system_story_media_type text
    check (system_story_media_type is null or system_story_media_type in ('image', 'video')),
  add column if not exists system_story_updated_at timestamptz;

-- Sem alteração de RLS: a policy "site_settings: admin update" já existente
-- (migration 0003) cobre update de qualquer coluna da linha única, e a rota
-- da API que grava esses campos já restringe a ação ao super_admin.
