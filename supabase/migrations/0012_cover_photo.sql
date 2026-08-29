-- ============================================================================
-- Foto de capa do perfil: campo dedicado para a imagem exibida no topo do
-- perfil público, independente da foto de perfil (avatar) e da galeria de
-- fotos. Quando não definida, o perfil continua caindo de volta para a
-- primeira foto da galeria (ou a foto de perfil), como já acontecia antes.
-- ============================================================================

alter table public.professional_profiles
  add column if not exists cover_photo text;
