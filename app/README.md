# Onde Relaxar — Plataforma de Profissionais de Massagem

Diretório/marketplace onde profissionais de massagem criam conta gratuita,
montam um perfil público e são encontrados por cidade, bairro e tipo de
massagem. Ver `../ARQUITETURA.md` na raiz do projeto para a visão completa
de arquitetura, banco de dados, rotas e fluxos.

## Já conectado ao Supabase real

Este projeto já vem com o `.env.local` configurado, apontando para o projeto
real "Onde Relaxar" no Supabase (org "Maazar"). As três migrations
(`0001_schema.sql`, `0002_rls.sql`, `0003_site_settings.sql`) já foram
executadas nesse banco. Basta rodar:

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — cadastro, login, upload de fotos (Supabase
Storage) e publicação de perfil já funcionam de ponta a ponta, direto no
banco real. Não é mais o modo demonstração.

Se algum dia precisar trocar de projeto Supabase (ex.: criar um projeto novo
do zero), repita:

1. Crie um projeto em https://supabase.com.
2. No SQL Editor do Supabase, rode nesta ordem os arquivos em
   `../supabase/migrations/`:
   - `0001_schema.sql` — tabelas, funções e seed de cidades/categorias.
   - `0002_rls.sql` — políticas de Row Level Security e bucket de fotos.
   - `0003_site_settings.sql` — textos editáveis da home/rodapé.
3. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (em
     Project Settings → API Keys → aba "Legacy anon, service_role API keys").
4. Rode `npm run dev` novamente.

### Tornar seu primeiro usuário administrador

Depois de criar sua conta pelo `/cadastro`, rode no SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

Isso libera o acesso a `/admin`, incluindo `/admin/configuracoes` — onde dá
para editar o título, subtítulo, selo e demais textos da home e do rodapé
sem tocar em código.

### Popular com profissionais de exemplo (opcional)

Com `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → service_role,
nunca exponha essa chave no browser) definido no `.env.local`:

```bash
npm run seed
```

> **Nota sobre fontes:** o layout usa Google Fonts via `next/font/google`
> (Inter + Fraunces). `npm run dev` funciona normalmente mesmo sem acesso a
> `fonts.googleapis.com` (usa uma fonte de fallback), mas `npm run build`
> precisa de acesso à internet para baixar as fontes — funciona sem
> configuração extra na Vercel e na maioria dos ambientes locais.

## Deploy na Vercel

O app é um projeto Next.js padrão. O arquivo `.env.local` está incluído
neste zip só para facilitar rodar localmente — ele é ignorado pelo git
(`.gitignore`) e a Vercel **não** lê esse arquivo automaticamente, então as
variáveis precisam ser configuradas manualmente no painel da Vercel (passo
3 abaixo).

### Passo a passo (via GitHub — recomendado)

1. Suba esta pasta para um repositório novo no GitHub (pode ser privado).
2. Em https://vercel.com → **Add New → Project** → importe esse repositório.
   A Vercel detecta que é Next.js automaticamente, não precisa mudar nada
   em build/output settings.
3. Antes de clicar em "Deploy", abra **Environment Variables** e adicione:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://fflfcmebcastqxluxynx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (copie do `.env.local` incluído no zip) |
   | `NEXT_PUBLIC_SITE_URL` | o domínio que a Vercel vai te dar, ex. `https://onde-relaxar.vercel.app` (dá pra editar depois) |

   `SUPABASE_SERVICE_ROLE_KEY` só é necessária se você for rodar `npm run
   seed` — não precisa configurar na Vercel a não ser que use essa função lá.
4. Clique em **Deploy**. Em poucos minutos o site fica no ar, já conectado
   ao banco real do Supabase.
5. Depois do primeiro deploy, se o domínio final for diferente do que você
   colocou em `NEXT_PUBLIC_SITE_URL` (ex.: você configurou um domínio
   próprio), atualize essa variável em **Project Settings → Environment
   Variables** e clique em **Redeploy** para o `sitemap.xml` e o Open Graph
   ficarem corretos.

### Alternativa (via Vercel CLI, sem GitHub)

```bash
npm install -g vercel
cd app
vercel          # deploy de preview, pede pra logar/linkar o projeto na primeira vez
vercel --prod   # deploy de produção
```

A CLI também ignora `.env.local` no upload — depois do primeiro `vercel`,
rode `vercel env add` para cada uma das três variáveis da tabela acima, ou
adicione pelo painel web como no passo 3.

### Tornar seu usuário administrador no site já publicado

Depois de criar sua conta pelo `/cadastro` no domínio da Vercel, o processo
é o mesmo do modo local — rode no SQL Editor do Supabase:

```sql
update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

## Estrutura

- `src/app` — rotas (App Router): home, `/massagistas/[cidade]`,
  `/perfil/[slug]`, autenticação, `/cadastro/perfil` (wizard), `/painel`
  (dashboard do profissional), `/admin` (área administrativa).
- `src/components` — componentes de UI reutilizáveis.
- `src/lib/data.ts` e `src/lib/admin-data.ts` — camada de acesso a dados
  (Supabase real ou dados mockados, dependendo da configuração).
- `src/lib/mock-data.ts` — dados de demonstração.
- `supabase/migrations` — schema SQL e políticas de RLS.
- `public/logo-onde-relaxar.png` — logo usada no cabeçalho e rodapé.
  `src/app/icon.png` e `src/app/apple-icon.png` — favicon e ícone para
  quando o site é adicionado à tela inicial do celular (convenção do Next.js
  App Router: basta trocar esses arquivos para atualizar a marca).

## Próximos passos sugeridos

- Conectar um gateway de pagamento (Stripe/Mercado Pago) e ativar cobrança
  para os planos `featured`/`premium` já modelados no banco.
- Adicionar confirmação de e-mail obrigatória antes da publicação do perfil
  (o Supabase Auth já suporta; hoje o cadastro não exige confirmação).
- Adicionar testes automatizados (Playwright/Vitest) antes de crescer o time.
