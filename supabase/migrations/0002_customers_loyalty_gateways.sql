-- ============================================================================
-- Acarajé O Abençoado — Delivery completo
-- Migration 0002: administradores, área do cliente + cartão fidelidade,
-- e cadastro de gateways de pagamento.
--
-- IMPORTANTE: esta migration reforça a segurança (RLS) porque agora existem
-- DOIS tipos de login usando Supabase Auth: administradores e clientes.
-- Antes, qualquer usuário autenticado tinha acesso total; agora só quem
-- está na tabela `admins` tem acesso administrativo.
-- Rode este arquivo DEPOIS do 0001_init.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ADMINS — quem pode acessar o Painel Administrativo
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

comment on table public.admins is 'Usuários com acesso ao Painel Administrativo. Vincula-se a auth.users pelo mesmo id.';

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- CUSTOMERS — área do cliente (quem consome os acarajés)
-- ----------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  total_units_purchased integer not null default 0,
  free_items_earned integer not null default 0,
  free_items_redeemed integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.customers is
  'Cliente que compra pelo site. total_units_purchased soma as quantidades de itens de pedidos ENTREGUES. '
  'A cada 10 unidades, 1 item grátis é liberado (free_items_earned = floor(total/10)). '
  'free_items_redeemed controla quantos já foram usados.';

-- Cria automaticamente a linha em "customers" quando um cliente se cadastra
-- (supabase.auth.signUp com options.data = { role: 'customer', name, phone }).
-- Usuários admin (criados fora desse fluxo) NÃO geram linha em customers.
create or replace function public.handle_new_customer_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.raw_user_meta_data->>'role') = 'customer' then
    insert into public.customers (auth_user_id, name, phone, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', 'Cliente'),
      new.raw_user_meta_data->>'phone',
      new.email
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_customer on auth.users;
create trigger on_auth_user_created_customer
  after insert on auth.users
  for each row execute function public.handle_new_customer_user();

-- ----------------------------------------------------------------------------
-- ORDERS — vincular ao cliente + controle de resgate/crédito de fidelidade
-- ----------------------------------------------------------------------------
alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.orders add column if not exists free_item_redeemed boolean not null default false;
alter table public.orders add column if not exists loyalty_units_credited integer; -- preenchido 1x quando o crédito é dado (evita contagem dupla)

-- Amplia os métodos de pagamento aceitos (mais gateways) mantendo os existentes
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('pix', 'dinheiro', 'cartao', 'pagseguro', 'mercadopago', 'stripe'));

-- ----------------------------------------------------------------------------
-- FUNÇÕES SEGURAS de fidelidade (SECURITY DEFINER — não dá pra "trapacear"
-- pelo client, pois cada função valida quem está chamando)
-- ----------------------------------------------------------------------------

-- Cliente resgata 1 item grátis (chamada no checkout). Só funciona para a
-- própria conta logada e só se houver saldo disponível.
create or replace function public.redeem_loyalty_free_item(p_customer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
begin
  if not exists (select 1 from public.customers where id = p_customer_id and auth_user_id = auth.uid()) then
    raise exception 'Não autorizado';
  end if;

  select (free_items_earned - free_items_redeemed) into v_available
  from public.customers where id = p_customer_id for update;

  if v_available is null or v_available < 1 then
    return false;
  end if;

  update public.customers set free_items_redeemed = free_items_redeemed + 1 where id = p_customer_id;
  return true;
end;
$$;

-- Admin credita as unidades compradas de um pedido ENTREGUE na fidelidade do
-- cliente (chamada pelo painel ao marcar "Entregue"). Idempotente: só credita
-- uma vez por pedido (loyalty_units_credited).
--
-- OBS: a contagem soma a QUANTIDADE de cada item do pedido. Um combo (ex:
-- "Quinteto Abençoado") conta como 1 unidade por padrão, mesmo contendo 5
-- bolinhos — ajuste a lógica abaixo se quiser que combos valham mais pontos.
create or replace function public.accrue_order_loyalty(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_units integer;
  v_already_credited integer;
begin
  if not public.is_admin() then
    raise exception 'Não autorizado';
  end if;

  select customer_id, loyalty_units_credited into v_customer_id, v_already_credited
  from public.orders where id = p_order_id;

  if v_customer_id is null or v_already_credited is not null then
    return; -- pedido de convidado (sem conta) ou crédito já concedido
  end if;

  select coalesce(sum(quantity), 0) into v_units from public.order_items where order_id = p_order_id;

  update public.customers
    set total_units_purchased = total_units_purchased + v_units,
        free_items_earned = floor((total_units_purchased + v_units) / 10.0)
    where id = v_customer_id;

  update public.orders set loyalty_units_credited = v_units where id = p_order_id;
end;
$$;

grant execute on function public.redeem_loyalty_free_item(uuid) to authenticated;
grant execute on function public.accrue_order_loyalty(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- PAYMENT GATEWAYS — espaço para cadastrar as credenciais de cada gateway
-- ----------------------------------------------------------------------------
create table if not exists public.payment_gateways (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('pix_manual', 'pagseguro', 'mercadopago', 'stripe', 'cielo', 'getnet')),
  display_name text not null,
  enabled boolean not null default false,
  public_key text,
  secret_key text,
  webhook_secret text,
  extra_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.payment_gateways is
  'Credenciais dos gateways de pagamento. Protegido por RLS (só admin lê/escreve). '
  'Para produção de alto risco, considere mover secret_key/webhook_secret para '
  'Supabase Edge Function secrets em vez de manter em tabela.';

insert into public.payment_gateways (provider, display_name, enabled)
values
  ('pix_manual', 'PIX Manual (chave copiável)', true),
  ('pagseguro', 'PagSeguro', false),
  ('mercadopago', 'Mercado Pago', false),
  ('stripe', 'Stripe', false),
  ('cielo', 'Cielo', false),
  ('getnet', 'Getnet', false)
on conflict (provider) do nothing;

create or replace function public.touch_payment_gateway_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_payment_gateway on public.payment_gateways;
create trigger trg_touch_payment_gateway
  before update on public.payment_gateways
  for each row execute function public.touch_payment_gateway_updated_at();

-- ============================================================================
-- RLS — reescrita completa agora que existem admins E clientes autenticados
-- ============================================================================
alter table public.admins enable row level security;
alter table public.customers enable row level security;
alter table public.payment_gateways enable row level security;

-- Remove as políticas antigas e permissivas demais (qualquer authenticated = admin)
drop policy if exists "admin gerencia motoboys" on public.motoboys;
drop policy if exists "admin le e atualiza pedidos" on public.orders;
drop policy if exists "admin le itens do pedido" on public.order_items;
drop policy if exists "admin gerencia corridas" on public.deliveries;

-- ---- ADMINS (tabela) --------------------------------------------------------
create policy "admin ve a si mesmo" on public.admins for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---- CUSTOMERS ---------------------------------------------------------------
create policy "cliente ve o proprio cadastro" on public.customers for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "admin gerencia clientes" on public.customers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- MOTOBOYS / DELIVERIES (somente admin) -----------------------------------
create policy "admin gerencia motoboys" on public.motoboys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin gerencia corridas" on public.deliveries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- ORDERS -------------------------------------------------------------------
create policy "admin acesso total pedidos" on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "cliente cria proprio pedido" on public.orders for insert to authenticated
  with check (
    customer_id is null
    or customer_id = (select id from public.customers where auth_user_id = auth.uid())
  );

create policy "cliente ve proprios pedidos" on public.orders for select to authenticated
  using (
    public.is_admin()
    or customer_id = (select id from public.customers where auth_user_id = auth.uid())
  );

-- ---- ORDER ITEMS ----------------------------------------------------------------
create policy "admin acesso total itens" on public.order_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "cliente cria itens do proprio pedido" on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id is null
          or o.customer_id = (select id from public.customers where auth_user_id = auth.uid())
        )
    )
  );

create policy "cliente ve itens dos proprios pedidos" on public.order_items for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = order_id and c.auth_user_id = auth.uid()
    )
  );

-- ---- PAYMENT GATEWAYS (somente admin, nunca exposto a anon/cliente) -----------
create policy "admin gerencia gateways" on public.payment_gateways for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Depois de importar (nessa ordem):
-- 1. Rode 0001_init.sql e depois este 0002.
-- 2. Rode `node supabase/seed-admin.mjs` (veja instruções no próprio arquivo)
--    para criar carlosgrecco16@gmail.com como administrador.
-- 3. Preencha as chaves dos gateways de pagamento pela aba "Gateways" do
--    Painel Administrativo (some depois de logar como admin).
-- ============================================================================
