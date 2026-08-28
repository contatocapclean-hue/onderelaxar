-- ============================================================================
-- Verificação automática de perfil por reconhecimento facial (selfie x fotos
-- do perfil, via AWS Rekognition). A selfie em si NUNCA é armazenada em
-- lugar nenhum — só o resultado da conferência (aprovado/reprovado, score,
-- data), para auditoria e para limitar tentativas por dia.
--
-- verification_status já era travado contra edição direta pelo dono
-- (RLS "prof_profiles: owner updates own"). Continua travado: quem libera o
-- selo automaticamente é a função SECURITY DEFINER abaixo, chamada pela rota
-- da API só depois de comparar a selfie com o serviço de reconhecimento
-- facial (mesmo padrão já usado em purchase_featured/purchase_story).
-- ============================================================================

alter table public.professional_profiles
  add column if not exists face_verified_at timestamptz,
  add column if not exists face_verification_score numeric;

create table if not exists public.face_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  matched boolean not null,
  similarity numeric,
  created_at timestamptz not null default now()
);
create index if not exists idx_face_verification_attempts_professional
  on public.face_verification_attempts(professional_id, created_at desc);

alter table public.face_verification_attempts enable row level security;

drop policy if exists "face_verification_attempts: owner or admin read" on public.face_verification_attempts;
create policy "face_verification_attempts: owner or admin read" on public.face_verification_attempts
  for select using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = face_verification_attempts.professional_id
        and (pp.user_id = auth.uid() or public.is_admin())
    )
  );

-- Função chamada pela rota da API depois de comparar a selfie (a selfie
-- nunca chega até o banco). Registra a tentativa e, se aprovada, libera o
-- selo de verificado sem precisar de aprovação manual.
create or replace function public.record_face_verification_attempt(
  p_professional_id uuid,
  p_matched boolean,
  p_similarity numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.professional_profiles where id = p_professional_id;
  if v_owner is null then
    raise exception 'Perfil não encontrado';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Não autorizado';
  end if;

  insert into public.face_verification_attempts (professional_id, matched, similarity)
  values (p_professional_id, p_matched, p_similarity);

  if p_matched then
    update public.professional_profiles
    set verification_status = 'verified',
        face_verified_at = now(),
        face_verification_score = p_similarity
    where id = p_professional_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;
