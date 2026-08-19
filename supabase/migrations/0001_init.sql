-- ============================================================================
-- Acarajé O Abençoado — Delivery completo
-- Migration inicial: tabelas, view de fechamento de caixa e RLS
-- Rode este arquivo no SQL Editor do Supabase (ou via CLI: supabase db push)
-- ============================================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- MOTOBOYS
-- ----------------------------------------------------------------------------
create table if not exists public.motoboys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  fee numeric(10,2) not null default 7.00, -- valor fixo pago por corrida (entrega)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.motoboys is 'Entregadores cadastrados. "fee" é o valor pago por corrida (atualizável a qualquer momento).';

-- ----------------------------------------------------------------------------
-- ORDERS (pedidos)
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  neighborhood text,
  reference text,

  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 7.00, -- frete único
  total numeric(10,2) not null default 0,

  payment_method text not null default 'pix'
    check (payment_method in ('pix', 'dinheiro', 'cartao', 'pagseguro')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  pagseguro_charge_id text,
  cash_change_for numeric(10,2), -- "troco para" quando pagamento em dinheiro

  order_status text not null default 'received'
    check (order_status in ('received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),

  motoboy_id uuid references public.motoboys(id) on delete set null,
  notes text,

  created_at timestamptz not null default now(),
  out_for_delivery_at timestamptz,
  delivered_at timestamptz
);

create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (order_status);
create index if not exists idx_orders_motoboy on public.orders (motoboy_id);

comment on table public.orders is 'Pedidos de delivery. delivery_fee é fixo (frete único do negócio).';

-- ----------------------------------------------------------------------------
-- ORDER ITEMS
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id integer,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null default 1,
  drink_label text,
  drink_price numeric(10,2) default 0,
  ingredients text, -- lista separada por vírgula, ex: "Bolinhos, Camarão, Caruru"
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items (order_id);

-- ----------------------------------------------------------------------------
-- DELIVERIES (corridas) — 1 corrida por pedido entregue, usado para fechar
-- caixa dos motoboys por noite. Permite lançamento manual (order_id nulo)
-- caso um motoboy faça uma corrida que não veio do site.
-- ----------------------------------------------------------------------------
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  motoboy_id uuid not null references public.motoboys(id) on delete cascade,
  fee numeric(10,2) not null, -- snapshot do valor pago nesta corrida
  shift_date date not null default current_date, -- "noite" de referência p/ fechamento
  status text not null default 'assigned'
    check (status in ('assigned', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_deliveries_motoboy_shift on public.deliveries (motoboy_id, shift_date);
create index if not exists idx_deliveries_order on public.deliveries (order_id);

comment on table public.deliveries is 'Uma linha por corrida. shift_date agrupa por noite para o fechamento de caixa do motoboy (nº corridas x fee).';

-- ----------------------------------------------------------------------------
-- VIEW: fechamento de caixa por motoboy / noite
-- ----------------------------------------------------------------------------
create or replace view public.motoboy_nightly_closing as
select
  d.motoboy_id,
  m.name as motoboy_name,
  d.shift_date,
  count(*) filter (where d.status = 'completed') as corridas_concluidas,
  count(*) filter (where d.status = 'assigned') as corridas_em_andamento,
  count(*) filter (where d.status = 'cancelled') as corridas_canceladas,
  coalesce(sum(d.fee) filter (where d.status = 'completed'), 0) as total_a_pagar
from public.deliveries d
join public.motoboys m on m.id = d.motoboy_id
group by d.motoboy_id, m.name, d.shift_date
order by d.shift_date desc, m.name;

-- ----------------------------------------------------------------------------
-- updated_at helper para orders (order_status muda bastante)
-- ----------------------------------------------------------------------------
create or replace function public.touch_order_timestamps()
returns trigger as $$
begin
  if new.order_status = 'out_for_delivery' and old.order_status is distinct from 'out_for_delivery' then
    new.out_for_delivery_at = now();
  end if;
  if new.order_status = 'delivered' and old.order_status is distinct from 'delivered' then
    new.delivered_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_order_timestamps on public.orders;
create trigger trg_touch_order_timestamps
  before update on public.orders
  for each row execute function public.touch_order_timestamps();

-- ============================================================================
-- REALTIME — habilita o painel administrativo a ouvir mudanças ao vivo
-- ============================================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.deliveries;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.motoboys enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.deliveries enable row level security;

-- ---- CLIENTE (anon / público no site) --------------------------------------
-- Pode CRIAR pedidos e itens do próprio pedido, mas nunca ler, alterar ou
-- apagar nada — inclusive não pode ler outros pedidos.
create policy "anon pode criar pedidos"
  on public.orders for insert
  to anon
  with check (true);

create policy "anon pode criar itens do pedido"
  on public.order_items for insert
  to anon
  with check (true);

-- Nenhuma policy de select/update/delete para "anon" = acesso negado por padrão.

-- ---- ADMIN (authenticated — login administrativo via Supabase Auth) -------
-- Acesso completo para qualquer usuário autenticado (equipe interna).
create policy "admin gerencia motoboys"
  on public.motoboys for all
  to authenticated
  using (true)
  with check (true);

create policy "admin le e atualiza pedidos"
  on public.orders for all
  to authenticated
  using (true)
  with check (true);

create policy "admin le itens do pedido"
  on public.order_items for all
  to authenticated
  using (true)
  with check (true);

create policy "admin gerencia corridas"
  on public.deliveries for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- Depois de importar:
-- 1. Ative "Email" no Supabase Auth (Authentication > Providers).
-- 2. Crie o usuário admin em Authentication > Users > Add User
--    (esse será o login/senha do Login Administrativo, substituindo o
--    usuário/senha fixos que estavam no código).
-- 3. Preencha o .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
-- 4. Cadastre os motoboys pela aba "Motoboys" do painel administrativo.
-- ============================================================================
