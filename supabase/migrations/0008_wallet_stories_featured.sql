-- ============================================================================
-- Carteira de saldo (depósito via Pix/Mercado Pago), destaque pago (7 dias)
-- e Stories (foto/vídeo que expira em 24h, R$0,59 cada), tudo debitado do
-- mesmo saldo.
--
-- Segurança: wallet_balance_cents e featured_until NUNCA podem ser
-- alterados diretamente pelo dono do perfil via update comum (RLS bloqueia,
-- igual já acontecia com is_featured/plan/verification_status). Toda
-- movimentação de saldo passa por funções SECURITY DEFINER
-- (purchase_featured, purchase_story, credit_wallet_deposit), que validam
-- saldo e dono antes de gravar — evitando que alguém edite o próprio saldo
-- direto pela API do Supabase.
-- ============================================================================

alter table public.professional_profiles
  add column if not exists wallet_balance_cents integer not null default 0,
  add column if not exists featured_until timestamptz;

alter table public.site_settings
  add column if not exists story_price_cents integer not null default 59;

update public.plans set price_cents = 1990 where code = 'featured' and price_cents = 0;

-- ---------------------------------------------------------------------------
-- Atualiza a política de update do dono para travar também os campos de
-- saldo/destaque (mesmo padrão já usado para verification_status/is_featured/plan)
-- ---------------------------------------------------------------------------
drop policy if exists "prof_profiles: owner updates own" on public.professional_profiles;

create policy "prof_profiles: owner updates own" on public.professional_profiles
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and verification_status = (select verification_status from public.professional_profiles where id = professional_profiles.id)
    and is_featured = (select is_featured from public.professional_profiles where id = professional_profiles.id)
    and plan = (select plan from public.professional_profiles where id = professional_profiles.id)
    and wallet_balance_cents = (select wallet_balance_cents from public.professional_profiles where id = professional_profiles.id)
    and featured_until is not distinct from (select featured_until from public.professional_profiles where id = professional_profiles.id)
  );

-- ---------------------------------------------------------------------------
-- wallet_transactions: extrato de movimentações (somente leitura para o
-- dono/admin — inserções só acontecem dentro das funções abaixo)
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  type text not null check (type in ('deposit', 'featured_purchase', 'story_purchase', 'refund')),
  amount_cents integer not null,
  description text,
  deposit_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_wallet_transactions_professional on public.wallet_transactions(professional_id);

alter table public.wallet_transactions enable row level security;

create policy "wallet_transactions: owner or admin read" on public.wallet_transactions
  for select using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id and (p.user_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- wallet_deposits: intenções de pagamento Pix (Mercado Pago). O dono cria a
-- linha (status pending) direto do app; a confirmação (status -> approved e
-- crédito no saldo) só acontece via credit_wallet_deposit(), chamada pelo
-- backend com service_role depois de confirmar o pagamento na API do
-- Mercado Pago (nunca confiando cegamente no webhook).
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  mp_payment_id text unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  qr_code text,
  qr_code_base64 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wallet_deposits_professional on public.wallet_deposits(professional_id);

alter table public.wallet_deposits enable row level security;

create policy "wallet_deposits: owner or admin read" on public.wallet_deposits
  for select using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id and (p.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "wallet_deposits: owner creates own" on public.wallet_deposits
  for insert with check (
    exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- stories: foto/vídeo temporário (expira em 24h), R$0,59 cada, debitado do
-- saldo via purchase_story()
-- ---------------------------------------------------------------------------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists idx_stories_professional on public.stories(professional_id);
create index if not exists idx_stories_expires on public.stories(expires_at);

alter table public.stories enable row level security;

-- leitura pública: só stories ainda ativos de perfis publicados;
-- dono/admin também enxergam os próprios stories mesmo já expirados
-- (histórico na área "Minha carteira")
create policy "stories: public read active or own" on public.stories
  for select using (
    (
      expires_at > now()
      and exists (
        select 1 from public.professional_profiles p
        where p.id = professional_id and (p.profile_status = 'published' or p.user_id = auth.uid() or public.is_admin())
      )
    )
    or exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id and (p.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "stories: owner creates own" on public.stories
  for insert with check (
    exists (select 1 from public.professional_profiles p where p.id = professional_id and p.user_id = auth.uid())
  );

create policy "stories: owner or admin deletes" on public.stories
  for delete using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id and (p.user_id = auth.uid() or public.is_admin())
    )
  );

-- bucket de storage para mídia de stories (mesmo padrão do profile-photos)
insert into storage.buckets (id, name, public)
values ('story-media', 'story-media', true)
on conflict (id) do nothing;

create policy "storage: public read story media" on storage.objects
  for select using (bucket_id = 'story-media');

create policy "storage: owner uploads story media to own folder" on storage.objects
  for insert with check (
    bucket_id = 'story-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage: owner deletes own story media" on storage.objects
  for delete using (
    bucket_id = 'story-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- purchase_featured(): debita o preço do plano "featured" (plans.price_cents)
-- do saldo e ativa/estende o destaque por 7 dias.
-- ---------------------------------------------------------------------------
create or replace function public.purchase_featured(p_professional_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_owner uuid;
  v_price int;
  v_current_until timestamptz;
begin
  select price_cents into v_price from public.plans where code = 'featured';
  if v_price is null then
    raise exception 'Plano de destaque não configurado';
  end if;

  select wallet_balance_cents, user_id, featured_until
    into v_balance, v_owner, v_current_until
    from public.professional_profiles
    where id = p_professional_id
    for update;

  if v_owner is null then
    raise exception 'Perfil não encontrado';
  end if;
  if v_owner <> auth.uid() and not public.is_admin() then
    raise exception 'Não autorizado';
  end if;
  if v_balance < v_price then
    raise exception 'Saldo insuficiente. Faça um depósito antes de ativar o destaque.';
  end if;

  update public.professional_profiles
  set wallet_balance_cents = wallet_balance_cents - v_price,
      is_featured = true,
      featured_until = greatest(coalesce(v_current_until, now()), now()) + interval '7 days'
  where id = p_professional_id;

  insert into public.wallet_transactions (professional_id, type, amount_cents, description)
  values (p_professional_id, 'featured_purchase', -v_price, 'Destaque ativado por 7 dias');

  return jsonb_build_object('ok', true, 'price_cents', v_price);
end;
$$;

grant execute on function public.purchase_featured(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- purchase_story(): debita o preço do story (site_settings.story_price_cents)
-- e cria a linha em stories. A mídia já deve ter sido enviada ao storage
-- (bucket story-media) antes de chamar esta função.
-- ---------------------------------------------------------------------------
create or replace function public.purchase_story(p_professional_id uuid, p_media_url text, p_media_type text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_owner uuid;
  v_price int;
  v_story_id uuid;
begin
  if p_media_type not in ('image', 'video') then
    raise exception 'Tipo de mídia inválido';
  end if;

  select coalesce(story_price_cents, 59) into v_price from public.site_settings where id = 1;

  select wallet_balance_cents, user_id into v_balance, v_owner
    from public.professional_profiles
    where id = p_professional_id
    for update;

  if v_owner is null then
    raise exception 'Perfil não encontrado';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Não autorizado';
  end if;
  if v_balance < v_price then
    raise exception 'Saldo insuficiente. Faça um depósito antes de publicar um story.';
  end if;

  update public.professional_profiles
  set wallet_balance_cents = wallet_balance_cents - v_price
  where id = p_professional_id;

  insert into public.wallet_transactions (professional_id, type, amount_cents, description)
  values (p_professional_id, 'story_purchase', -v_price, 'Publicação de story');

  insert into public.stories (professional_id, media_url, media_type)
  values (p_professional_id, p_media_url, p_media_type)
  returning id into v_story_id;

  return jsonb_build_object('ok', true, 'story_id', v_story_id, 'price_cents', v_price);
end;
$$;

grant execute on function public.purchase_story(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- credit_wallet_deposit(): credita um depósito Pix aprovado. Só pode ser
-- chamada pelo backend (service_role) — NUNCA pelo cliente autenticado —
-- depois que o backend confirmou o status real do pagamento direto na API
-- do Mercado Pago (o webhook nunca é a única fonte de verdade).
-- Idempotente: chamar de novo para um depósito já aprovado não credita
-- duas vezes.
-- ---------------------------------------------------------------------------
create or replace function public.credit_wallet_deposit(p_deposit_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deposit record;
begin
  select * into v_deposit from public.wallet_deposits where id = p_deposit_id for update;

  if v_deposit is null then
    raise exception 'Depósito não encontrado';
  end if;

  if v_deposit.status = 'approved' then
    return jsonb_build_object('ok', true, 'already_credited', true);
  end if;

  update public.wallet_deposits
  set status = 'approved', updated_at = now()
  where id = p_deposit_id;

  update public.professional_profiles
  set wallet_balance_cents = wallet_balance_cents + v_deposit.amount_cents
  where id = v_deposit.professional_id;

  insert into public.wallet_transactions (professional_id, type, amount_cents, description, deposit_id)
  values (v_deposit.professional_id, 'deposit', v_deposit.amount_cents, 'Depósito via Pix', p_deposit_id);

  return jsonb_build_object('ok', true, 'already_credited', false);
end;
$$;

grant execute on function public.credit_wallet_deposit(uuid) to service_role;
