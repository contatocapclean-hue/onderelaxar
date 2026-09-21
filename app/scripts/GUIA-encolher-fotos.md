# Guia: como encolher as fotos grandes que já estão no Supabase

Este guia te ajuda a rodar, no seu próprio computador, o script que reduz o tamanho das fotos que já estão salvas (as fotos novas já são comprimidas automaticamente antes do envio, isso já está no ar). Isso vai parar de estourar a cota de "Cached Egress" do Supabase.

Você vai precisar da sua chave `service_role` do Supabase — essa é uma chave com acesso total, então ela **nunca deve ser colada no chat com a Claude nem em nenhum outro lugar público**. Ela só vai para um arquivo no seu computador, que fica só com você.

## Passo 1 — Instalar o Node.js (se ainda não tiver)

1. Acesse https://nodejs.org
2. Baixe a versão "LTS" (recomendada) para o seu sistema (Windows ou Mac).
3. Instale normalmente, clicando em "Next"/"Avançar" até o fim.
4. Para conferir se funcionou, abra o Terminal (Mac) ou o Prompt de Comando/PowerShell (Windows) e digite:
   ```
   node -v
   ```
   Se aparecer um número de versão (tipo `v20.11.0`), está tudo certo.

## Passo 2 — Baixar o código do site

1. Acesse: https://github.com/contatocapclean-hue/onderelaxar
2. Clique no botão verde **"Code"**.
3. Clique em **"Download ZIP"**.
4. Depois de baixar, extraia o ZIP (clique com o botão direito → "Extrair aqui" ou dê dois cliques, dependendo do sistema).
5. Você vai ter uma pasta chamada algo como `onderelaxar-main`.

## Passo 3 — Abrir o terminal na pasta certa

1. Abra o Terminal (Mac) ou PowerShell (Windows).
2. Entre na pasta `app` dentro do que você extraiu. Por exemplo, se você extraiu na pasta Downloads:

   **Mac:**
   ```
   cd ~/Downloads/onderelaxar-main/app
   ```

   **Windows:**
   ```
   cd Downloads\onderelaxar-main\app
   ```

   Dica: você pode digitar `cd ` (com espaço depois) e arrastar a pasta `app` para dentro da janela do terminal — ele completa o caminho sozinho.

## Passo 4 — Instalar as dependências

Ainda dentro da pasta `app`, rode, um de cada vez:

```
npm install
```

Espere terminar (pode demorar um minuto), depois rode:

```
npm install sharp
```

Esse segundo comando instala a ferramenta que redimensiona as imagens.

## Passo 5 — Criar o arquivo com sua chave do Supabase

1. Dentro da pasta `app`, crie um arquivo novo chamado exatamente `.env.local` (com o ponto no início, sem nada depois de "local").
   - No Mac/Windows, se o editor de texto não deixar salvar um arquivo começando com ponto, você pode criar pelo terminal. Rode este comando (ele já cria o arquivo vazio):
     ```
     touch .env.local
     ```
     (No Windows PowerShell, use: `New-Item .env.local`)
2. Abra esse arquivo `.env.local` com o Bloco de Notas, TextEdit, ou qualquer editor de texto simples.
3. Cole exatamente isto dentro dele:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fflfcmebcastqxluxynx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=cole_aqui_a_sua_chave_service_role
   ```

4. Troque `cole_aqui_a_sua_chave_service_role` pela sua chave de verdade (a que você tem no painel do Supabase, em **Project Settings → API → service_role**). É uma sequência longa que começa com `sb_secret_...`.
5. Salve e feche o arquivo.

**Importante:** esse arquivo `.env.local` fica só no seu computador. Nunca envie ele, nem o conteúdo dele, para mim ou para qualquer chat.

## Passo 6 — Rodar uma simulação primeiro (não altera nada)

Ainda no terminal, dentro da pasta `app`, rode:

```
node scripts/shrink-existing-photos.mjs --dry-run
```

Isso vai listar todas as fotos, mostrando quais seriam reduzidas e o quanto (por exemplo, `FARIA 21.24 MB -> 1.10 MB`). Nada é alterado nessa etapa — é só para você ver o que vai acontecer.

Se aparecer algum erro, pode copiar a mensagem e me mostrar aqui que eu te ajudo a entender.

## Passo 7 — Rodar de verdade

Se o resultado da simulação fez sentido, rode o comando sem o `--dry-run`:

```
node scripts/shrink-existing-photos.mjs
```

Isso vai baixar cada foto grande, reduzir o tamanho e salvar de volta no mesmo lugar (o link da foto continua o mesmo, então nada quebra no site). Vai aparecer no final um resumo tipo:

```
12 fotos reduzidas, 0 erros.
Tamanho: 145.30 MB -> 18.40 MB (economia de 126.90 MB).
```

Pronto — as fotos antigas grandes estarão bem menores, e as novas fotos que forem enviadas a partir de agora já saem comprimidas automaticamente. Isso deve resolver o estouro de cota do Supabase.

## Se algo der errado

Copie a mensagem de erro exata que apareceu no terminal e me mande aqui — eu te ajudo a entender o que houve, sem precisar da sua chave.
