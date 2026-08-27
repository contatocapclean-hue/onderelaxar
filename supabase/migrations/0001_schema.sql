-- ============================================================================
-- Plataforma de Profissionais de Massagem — schema inicial
-- ============================================================================
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: estende auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- cria a linha em profiles automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- cities
-- ---------------------------------------------------------------------------
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- service_categories
-- ---------------------------------------------------------------------------
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- professional_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  professional_name text not null,
  slug text not null unique,
  description text,
  city_id uuid references public.cities(id),
  neighborhood text,
  profile_photo text,
  attendance_type text not null default 'own_place'
    check (attendance_type in ('own_place', 'client_home', 'both')),
  venue_name text,
  venue_address text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified')),
  profile_status text not null default 'draft'
    check (profile_status in ('draft', 'pending_review', 'published', 'rejected', 'suspended')),
  is_featured boolean not null default false,
  plan text not null default 'free' check (plan in ('free', 'featured', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_professional_profiles_city on public.professional_profiles(city_id);
create index if not exists idx_professional_profiles_status on public.professional_profiles(profile_status);

-- ---------------------------------------------------------------------------
-- professional_services (N:N)
-- ---------------------------------------------------------------------------
create table if not exists public.professional_services (
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  category_id uuid not null references public.service_categories(id) on delete cascade,
  primary key (professional_id, category_id)
);

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  image_url text not null,
  kind text not null default 'gallery' check (kind in ('profile', 'venue', 'gallery')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- contact_info (1:1)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_info (
  professional_id uuid primary key references public.professional_profiles(id) on delete cascade,
  whatsapp text,
  phone text,
  email text,
  instagram text,
  whatsapp_visibility text not null default 'on_request'
    check (whatsapp_visibility in ('public', 'on_request', 'hidden')),
  phone_visibility text not null default 'hidden'
    check (phone_visibility in ('public', 'on_request', 'hidden')),
  email_visibility text not null default 'hidden'
    check (email_visibility in ('public', 'on_request', 'hidden')),
  instagram_visibility text not null default 'public'
    check (instagram_visibility in ('public', 'on_request', 'hidden'))
);

-- ---------------------------------------------------------------------------
-- profile_statistics (1:1) — só alterada via RPC
-- ---------------------------------------------------------------------------
create table if not exists public.profile_statistics (
  professional_id uuid primary key references public.professional_profiles(id) on delete cascade,
  views int not null default 0,
  whatsapp_clicks int not null default 0,
  contact_clicks int not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.increment_profile_stat(p_professional_id uuid, p_field text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_field not in ('views', 'whatsapp_clicks', 'contact_clicks') then
    raise exception 'invalid field';
  end if;

  insert into public.profile_statistics (professional_id) values (p_professional_id)
  on conflict (professional_id) do nothing;

  if p_field = 'views' then
    update public.profile_statistics set views = views + 1, updated_at = now()
      where professional_id = p_professional_id;
  elsif p_field = 'whatsapp_clicks' then
    update public.profile_statistics set whatsapp_clicks = whatsapp_clicks + 1, updated_at = now()
      where professional_id = p_professional_id;
  else
    update public.profile_statistics set contact_clicks = contact_clicks + 1, updated_at = now()
      where professional_id = p_professional_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- reports (denúncias)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  reporter_id uuid references public.profiles(id),
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- plans (schema pronto para monetização futura — sem cobrança ativa)
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('free', 'featured', 'premium')),
  name text not null,
  max_photos int not null default 5,
  search_priority int not null default 0,
  has_badge boolean not null default false,
  price_cents int not null default 0,
  is_active boolean not null default true
);

insert into public.plans (code, name, max_photos, search_priority, has_badge, price_cents)
values
  ('free', 'Gratuito', 5, 0, false, 0),
  ('featured', 'Destaque', 12, 10, false, 0),
  ('premium', 'Premium', 20, 20, true, 0)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- seed básico de categorias e cidades (exemplo Bahia)
-- ---------------------------------------------------------------------------
insert into public.service_categories (name, slug, icon) values
  ('Massagem Relaxante', 'massagem-relaxante', 'sparkles'),
  ('Massagem Terapêutica', 'massagem-terapeutica', 'heart-pulse'),
  ('Massagem Desportiva', 'massagem-desportiva', 'dumbbell'),
  ('Drenagem Linfática', 'drenagem-linfatica', 'droplet'),
  ('Massagem Modeladora', 'massagem-modeladora', 'wand'),
  ('Shiatsu', 'shiatsu', 'hand'),
  ('Reflexologia', 'reflexologia', 'footprints'),
  ('Massagem Ayurvédica', 'massagem-ayurvedica', 'leaf'),
  ('Pedras Quentes', 'pedras-quentes', 'flame'),
  ('Outros Serviços', 'outros-servicos', 'plus')
on conflict (slug) do nothing;

insert into public.cities (name, state, slug) values
  ('Salvador', 'BA', 'salvador-ba'),
  ('Feira de Santana', 'BA', 'feira-de-santana-ba'),
  ('Lauro de Freitas', 'BA', 'lauro-de-freitas-ba'),
  ('Camaçari', 'BA', 'camacari-ba')
on conflict (slug) do nothing;
