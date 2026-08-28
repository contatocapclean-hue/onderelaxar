-- ============================================================================
-- Corrige contact_info: faltava uma política de leitura pública para
-- perfis publicados. Sem ela, a RLS bloqueava a leitura da linha inteira
-- de contact_info para qualquer visitante (só dono/admin liam), então a
-- seção "Entrar em contato" (WhatsApp, telefone, e-mail, Instagram) nunca
-- aparecia de fato para o público, independentemente das preferências de
-- visibilidade configuradas pelo profissional. A aplicação já filtra os
-- campos por visibilidade no código — o que faltava era permitir a leitura
-- da linha em si, como já acontece com photos e professional_services.
-- ============================================================================

create policy "contact_info: public read of published profiles" on public.contact_info
  for select using (
    exists (
      select 1 from public.professional_profiles p
      where p.id = professional_id
        and (p.profile_status = 'published' or p.user_id = auth.uid() or public.is_admin())
    )
  );
