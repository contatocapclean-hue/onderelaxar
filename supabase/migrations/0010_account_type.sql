-- ============================================================================
-- account_type: distingue contas de "anunciante" (quer montar perfil
-- profissional) de "visitante" (só quer navegar/pesquisar). Perguntado logo
-- após o passo 1 do cadastro — visitantes nunca são levados ao assistente de
-- criação de perfil profissional.
-- ============================================================================

alter table public.profiles
  add column if not exists account_type text
    check (account_type is null or account_type in ('anunciante', 'visitante'));

-- Contas criadas antes desse recurso existir já são todas profissionais
-- usando o painel normalmente — tratamos como "anunciante" explicitamente.
-- Novos cadastros ficam com account_type nulo até responderem à pergunta em
-- /cadastro/objetivo; o app trata nulo como "anunciante" por padrão em
-- qualquer lugar que precise decidir (nunca força ninguém a virar visitante).
update public.profiles set account_type = 'anunciante' where account_type is null;

-- Fecha uma lacuna na policy de update de profiles: o nome já dizia "not
-- role", mas o "with check" nunca de fato impedia o próprio usuário alterar
-- seu role (ex.: virar admin sozinho via update direto na tabela). Usa o
-- mesmo padrão de auto-referência já usado para travar colunas sensíveis em
-- professional_profiles/wallet_deposits.
drop policy if exists "profiles: user updates own (not role)" on public.profiles;
create policy "profiles: user updates own (not role)" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = profiles.id)
  );
