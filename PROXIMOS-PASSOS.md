# ✅ Banco já está no ar

O projeto Supabase **"cardapio"** já foi criado e todas as migrations (0001 a 0007) já foram
aplicadas nele — tabelas, RLS, funções de fidelidade, funções de relatório do CRM, linha do
tempo, avaliação e comissão do admin master, tudo pronto. O `.env` deste projeto já vem
preenchido com as credenciais reais:

- URL: `https://vuktebsuswtlhmfffifd.supabase.co`
- Projeto no painel do Supabase: procure por "cardapio" em supabase.com/dashboard

**O que ainda falta fazer manualmente** (não dá pra automatizar sem a service role key):

1. **Criar o usuário administrador**: pegue a *service role key* em
   Settings → API → o campo abaixo da anon key (⚠️ nunca cole essa chave em nenhum arquivo
   do projeto) e rode:
   ```
   SUPABASE_URL=https://vuktebsuswtlhmfffifd.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY \
   npm run seed:admin
   ```
   Isso cria `carlosgrecco16@gmail.com` / `24151981` com acesso ao Painel.

2. **Configurar os gateways de pagamento**: Painel → aba "Gateways" → ative e preencha as
   chaves de quem você já tem conta.

3. **Cadastrar motoboys** e **promoções do carrossel** pelas respectivas abas do Painel.

# O que foi implementado

- **Carrinho de compras** (`src/context/CartContext.tsx`, `CartButton`, `CartDrawer`): adicione produtos com bebida/ingredientes escolhidos no `ProductModal`, ajuste quantidades, veja subtotal + frete único (R$ 7,00, configurável em `DELIVERY_FEE`).
- **Checkout** (`CheckoutModal`): dados do cliente, endereço, forma de pagamento (Pix, dinheiro, cartão na entrega; outros gateways prontos pra ativar) e envio do pedido para o Supabase. Se o cliente estiver logado, o formulário já vem pré-preenchido e ele pode resgatar 1 acarajé grátis da fidelidade.
- **Banco de dados**: `supabase/migrations/0001_init.sql` (pedidos, itens, motoboys, corridas, fechamento) + `supabase/migrations/0002_customers_loyalty_gateways.sql` (administradores, clientes, cartão fidelidade, gateways de pagamento) com RLS completo.
- **Painel administrativo** (login real via Supabase Auth, restrito a quem está na tabela `admins`):
  - **Pedidos**: tempo real, avança status, atribui motoboy (cria a corrida), credita fidelidade automaticamente ao marcar "Entregue".
  - **Motoboys**: cadastro, valor fixo por corrida, ativar/desativar.
  - **Fechamento de Caixa**: corridas concluídas × valor fixo = total a pagar, por noite e por motoboy.
  - **Gateways**: cadastro de chaves (pública/secreta/webhook) de PagSeguro, Mercado Pago, Stripe, Cielo e Getnet, cada um com liga/desliga independente. PIX manual já vem ativado.
- **Área do Cliente** (quem compra os acarajés):
  - Cadastro/login próprio (separado do admin), aba "Fidelidade" na barra inferior.
  - **Cartão fidelidade**: a cada 10 acarajés comprados (somando a quantidade de itens de pedidos *entregues*), o 11º fica grátis. Selo visual com progresso.
  - **Histórico completo**: todos os pedidos do cliente, com itens, status e forma de pagamento.
  - Resgate do item grátis feito com segurança no banco (função `redeem_loyalty_free_item`, ninguém consegue burlar pelo navegador).
- **Carrossel de promoções no Hero**: o banner do topo agora é um carrossel com autoplay (5,5s), arraste no celular, setas no desktop e bolinhas de navegação. Gerenciado 100% pela aba "Promoções" do Painel — título, subtítulo, selo (ex: "Só hoje"), imagem e link opcional. Sem nenhuma promoção ativa, volta pro banner padrão.
- **CRM (aba inicial do Painel)**: KPIs de total vendido, acarajés vendidos, número de entregas, ticket médio e avaliação média; gráfico de vendas por forma de pagamento (dinheiro, PIX, cartão, outros gateways); gráfico de vendas por dia; comissão do admin master; e tabela de valor a pagar por motoboy — tudo filtrável por Hoje / 7 dias / Quinzena / Mês / período personalizado. Considera "venda" todo pedido marcado como **Entregue**, e cada acarajé é contado pela quantidade de itens do pedido (ver observação sobre combos mais abaixo).
- **Linha do tempo do pedido**: tanto no Painel (aba Pedidos) quanto na Área do Cliente, cada pedido mostra visualmente os 4 estágios (Recebido → Em preparo → Saiu para entrega → Entregue) com o horário de cada um.
- **Avaliação do cliente**: depois que um pedido é entregue, o cliente pode dar de 1 a 5 estrelas + justificar o motivo, direto na Área do Cliente. Só pode avaliar uma vez, e só o próprio pedido (protegido por função seria no banco). O admin vê a nota e o comentário na aba Pedidos, e a média do período aparece como KPI no CRM.
- **Comissão do admin master**: no CRM, um campo para definir o percentual (sugestão de 5% a 20%, mas aceita 0-100%) que vai para o dono da plataforma sobre tudo que for vendido no sistema. O valor em R$ da comissão é recalculado automaticamente pro período selecionado.
- **PWA**: manifest + service worker, bottom sheets em todos os modais, barra de navegação inferior fixa (Cardápio / Carrinho / Fidelidade / Painel).

# Passo a passo para colocar no ar

1. **Instale as dependências**:
   ```
   npm install
   ```

2. **Crie um projeto no Supabase** e rode as migrations **NESTA ORDEM**, no SQL Editor:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_customers_loyalty_gateways.sql`
   - `supabase/migrations/0003_promotions.sql`

3. **Configure as variáveis de ambiente**:
   ```
   cp .env.example .env
   ```
   Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Settings → API).

4. **Crie o usuário administrador** (carlosgrecco16@gmail.com):
   ```
   SUPABASE_URL=https://SEU-PROJETO.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY \
   npm run seed:admin
   ```
   A *service role key* fica em Settings → API → um nível abaixo da anon key (⚠️ nunca coloque essa chave no `.env` do front-end). O script cria o login `carlosgrecco16@gmail.com` / `24151981` e já libera o acesso ao Painel Administrativo.

5. **Rode localmente**:
   ```
   npm run dev
   ```

6. **Configure os gateways de pagamento**: entre no Painel (aba "Painel" → login) → aba "Gateways" → ative e preencha as chaves de cada um que você já tiver conta (PagSeguro, Mercado Pago, Stripe, Cielo, Getnet). Os desativados ficam prontos, esperando as chaves.

7. **Cadastre as promoções do carrossel**: aba "Promoções" do Painel → cole o link de uma imagem já hospedada (Cloudinary, Imgur etc.), título, subtítulo e link opcional.

8. **Cadastre os motoboys** na aba "Motoboys" do painel, com o valor fixo por corrida de cada um.

9. **Deploy**: configure as mesmas variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) no painel da Vercel — a `SERVICE_ROLE_KEY` NUNCA vai para o front-end, é só usada localmente/uma vez para rodar o `seed:admin`.

# Sobre a contagem da fidelidade

O crédito de fidelidade soma a **quantidade de itens** de cada pedido *entregue* (ex.: 2x "Acarajé no Saquinho" = 2 selos). Um combo (ex. "Quinteto Abençoado", que contém 5 bolinhos) conta como **1 selo** por padrão, já que é vendido como um único item na loja. Se quiser que combos valham mais selos (ex.: Quinteto = 5 selos), é só ajustar a lógica dentro da função `accrue_order_loyalty` na migration 0002 (está bem comentada).

