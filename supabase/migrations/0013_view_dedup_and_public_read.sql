-- ---------------------------------------------------------------------------
-- Visualizações do perfil: dedupe por IP durante 24h e leitura pública
-- ---------------------------------------------------------------------------
-- Problema 1: toda vez que a página do perfil carregava, o contador de
-- "views" era incrementado sem nenhuma verificação — atualizar a página
-- repetidas vezes inflava a contagem. Agora guardamos, por perfil + IP do
-- visitante (com hash, sem guardar o IP em texto puro), o último momento em
-- que essa visita contou; só conta de novo depois de 24h.
--
-- Problema 2: a política de leitura de profile_statistics só permitia que o
-- dono do perfil (ou um admin) lesse a linha, então qualquer visitante sem
-- login via sempre "0 visualizações", mesmo com a contagem real crescendo no
-- banco. Criamos uma função "security definer" que expõe só o número de
-- visualizações (sem os cliques de whatsapp/contato, que continuam privados)
-- para qualquer um consultar.

create table if not exists public.profile_view_dedup (
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  ip_hash text not null,
  last_counted_at timestamptz not null default now(),
  primary key (professional_id, ip_hash)
);

alter table public.profile_view_dedup enable row level security;
-- Nenhuma policy é criada: só a função abaixo (security definer) acessa esta
-- tabela; clientes não têm nenhum acesso direto de leitura ou escrita.

-- Registra uma visualização, contando no máximo uma vez por perfil+IP a cada
-- 24 horas. Retorna true se a visualização foi de fato contada.
create or replace function public.register_profile_view(p_professional_id uuid, p_ip_hash text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_rows int;
begin
  insert into public.profile_view_dedup (professional_id, ip_hash, last_counted_at)
  values (p_professional_id, p_ip_hash, now())
  on conflict (professional_id, ip_hash) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    perform public.increment_profile_stat(p_professional_id, 'views');
    return true;
  end if;

  update public.profile_view_dedup
  set last_counted_at = now()
  where professional_id = p_professional_id
    and ip_hash = p_ip_hash
    and last_counted_at < now() - interval '24 hours';
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    perform public.increment_profile_stat(p_professional_id, 'views');
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.register_profile_view(uuid, text) to anon, authenticated;

-- Leitura pública da contagem de visualizações (sem expor whatsapp_clicks /
-- contact_clicks, que continuam restritos ao dono via a policy já existente
-- "stats: owner reads own").
create or replace function public.get_profile_view_count(p_professional_id uuid)
returns integer
language sql
security definer set search_path = public
stable
as $$
  select coalesce(views, 0) from public.profile_statistics where professional_id = p_professional_id;
$$;

grant execute on function public.get_profile_view_count(uuid) to anon, authenticated;
