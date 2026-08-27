# Arquitetura da Plataforma — Diretório de Profissionais de Massagem

## 1. Visão geral

Marketplace/diretório onde profissionais de massagem criam conta gratuita, montam
um perfil público e são descobertos por cidade, bairro e tipo de massagem.
Arquitetura preparada desde o início para monetização futura (planos, destaque,
selo verificado pago) sem exigir retrabalho estrutural.

**Stack**

| Camada | Tecnologia |
|---|---|
| Frontend / SSR | Next.js 14 (App Router), TypeScript |
| Estilo | Tailwind CSS |
| Backend / BaaS | Supabase (Postgres, Auth, Storage, Row Level Security) |
| Hospedagem sugerida | Vercel (app) + Supabase Cloud (dados) |
| Imagens | Supabase Storage com upload assinado |

O app roda em **modo demo** com dados mockados quando as variáveis
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estão
configuradas — isso permite rodar `npm run dev` e ver a plataforma
funcionando imediatamente, antes de criar o projeto no Supabase. Ao
configurar as variáveis, a mesma aplicação passa a ler/gravar dados reais.

## 2. Banco de dados (resumo — schema completo em `supabase/migrations`)

- **profiles** — estende `auth.users`: nome, e-mail, role (`user` | `admin`).
- **cities** — cidades habilitadas na plataforma (nome, UF, slug).
- **service_categories** — categorias de massagem (nome, slug, ícone).
- **professional_profiles** — o anúncio em si: nome profissional, slug,
  descrição, cidade, bairro, foto principal, tipo de atendimento (próprio /
  domicílio / ambos), `verification_status`, `profile_status`
  (`draft` | `pending_review` | `published` | `rejected` | `suspended`),
  `is_featured`, `plan` (`free` | `featured` | `premium` — préparado para o
  futuro), timestamps.
- **professional_services** — tabela de junção N:N entre perfis e categorias.
- **photos** — galeria (professional_id, url, ordem, tipo: perfil/ambiente/serviço).
- **contact_info** — whatsapp, telefone, e-mail, instagram + `visibility`
  por canal (`public` | `on_request` | `hidden`).
- **profile_statistics** — views, whatsapp_clicks, contact_clicks (contadores
  incrementados via função RPC, nunca editáveis pelo cliente diretamente).
- **reports** — denúncias de perfis (motivo, status, quem denunciou).
- **plans** (schema pronto, sem cobrança ativa) — planos e limites (nº de
  fotos, prioridade de busca, selo).
- **site_settings** — linha única com os textos editáveis da home e do
  rodapé (selo, título, subtítulo, chamada final, descrição do rodapé).
  Leitura pública, escrita só por `role = 'admin'` via `/admin/configuracoes`
  — dá ao dono do site controle sobre o conteúdo sem precisar editar código.

Relacionamentos: `auth.users 1—1 profiles 1—N professional_profiles`
(um usuário pode ter mais de um perfil profissional, ex.: multi-cidade);
`professional_profiles N—N service_categories`; `professional_profiles
1—N photos`; `professional_profiles 1—1 contact_info`; `professional_profiles
1—1 profile_statistics`.

## 3. Rotas / páginas

| Rota | Descrição |
|---|---|
| `/` | Home: hero + busca, categorias, profissionais em destaque, cidades |
| `/massagistas/[cidade]` | Listagem por cidade com filtros |
| `/massagistas/[cidade]/[bairro]` | Listagem filtrada por bairro (SEO) |
| `/massagem-relaxante/[cidade]` (padrão por categoria) | Landing SEO por categoria+cidade |
| `/perfil/[slug]` | Página pública do profissional |
| `/entrar`, `/cadastro` | Login e criação de conta |
| `/recuperar-senha` | Recuperação de senha |
| `/cadastro/perfil` (wizard 5 passos) | Conta → Perfil → Fotos → Contato → Publicar |
| `/painel` | Dashboard do profissional (protegido) |
| `/painel/perfil`, `/fotos`, `/servicos`, `/local`, `/contatos`, `/estatisticas`, `/configuracoes` | Sub-seções do painel |
| `/admin` | Dashboard administrativo (protegido, role=admin) |
| `/admin/usuarios`, `/perfis`, `/cidades`, `/categorias`, `/denuncias`, `/configuracoes` | Gestão administrativa e textos editáveis do site |

## 4. Fluxos de usuário

**Profissional novo:** cria conta (e-mail/senha) → preenche perfil → adiciona
fotos → define contatos e visibilidade → revisa prévia → publica (status vai
para `pending_review` se moderação manual estiver ativa, ou `published`
direto no modo auto-aprovação) → acessa painel para editar e ver métricas.

**Visitante:** busca por cidade na home ou acessa `/massagistas/[cidade]` →
aplica filtros → abre `/perfil/[slug]` (incrementa `views`) → clica em
WhatsApp/contato (incrementa `whatsapp_clicks`/`contact_clicks`, respeitando
a visibilidade escolhida pelo profissional).

**Admin:** login com role `admin` → aprova/reprova perfis pendentes → marca
verificado/destaque → modera denúncias → gerencia cidades e categorias.

## 5. Componentes principais

`Header`, `Footer`, `CitySelect`, `HeroSearch`, `CategoryCard`,
`ProfessionalCard`, `FiltersBar` (desktop) / `FiltersSheet` (mobile),
`Gallery`, `VerifiedBadge`, `ContactButtons`, `StatCard`, `DashboardShell`,
`AdminShell`, `ProfileWizardStepper`, `StatusBadge`.

## 6. Segurança (Row Level Security no Supabase)

- `professional_profiles`: leitura pública apenas onde `profile_status =
  'published'`; escrita restrita a `user_id = auth.uid()`; qualquer coluna de
  moderação (`verification_status`, `is_featured`, `profile_status`) só é
  alterável por `role = 'admin'` via política separada.
- `photos`, `contact_info`: mesma regra — dono lê/escreve o próprio,
  leitura pública só quando o perfil pai está publicado.
- `profile_statistics`: leitura pelo dono; incremento apenas via função
  `security definer` (RPC), nunca `UPDATE` direto do cliente — evita fraude
  de métricas.
- `reports`: qualquer usuário autenticado pode criar; leitura/gestão só admin.
- Upload de imagens no Storage: bucket privado por padrão com política que
  só permite ao dono do perfil escrever no seu próprio path
  (`{professional_id}/...`), leitura pública via URL assinada/CDN.

## 7. SEO

`generateMetadata` dinâmico por página (title, description, Open Graph),
`sitemap.xml` gerado a partir de cidades/categorias/perfis publicados,
`robots.txt`, dados estruturados `LocalBusiness`/`Person` (JSON-LD) na
página de perfil, URLs amigáveis com slug.

## 8. Caminho de monetização futura

Estrutura já modela `plan` no perfil e tabela `plans`. Para ativar cobrança
no futuro: (1) criar tabela `subscriptions` ligada a um gateway (Stripe/
Mercado Pago), (2) usar `plan` para alterar ordenação de busca (`is_featured`
e `plan` entram no `ORDER BY`), limite de fotos e badges — sem migrar dados
existentes.
