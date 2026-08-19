-- ============================================================================
-- Migration 0010:
-- 1) Numeração própria e sequencial dos pedidos (order_number)
-- 2) Código de confirmação de entrega (delivery_code) + avaliação do motoboy
-- 3) Bebidas com imagem, gerenciadas pelo admin (tabela drinks)
-- 4) Área do motoboy: login por telefone + PIN (sem Supabase Auth), sessão
--    própria, e confirmação de entrega validando o código com o cliente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ORDERS: numeração sequencial, código de entrega, avaliação do motoboy
-- ----------------------------------------------------------------------------
alter table public.orders add column if not exists order_number bigserial;
alter table public.orders add column if not exists delivery_code text;
alter table public.orders add column if not exists motoboy_rating smallint check (motoboy_rating between 1 and 5);
alter table public.orders add column if not exists motoboy_rating_comment text;
alter table public.orders add column if not exists motoboy_rated_at timestamptz;

create unique index if not exists idx_orders_order_number on public.orders (order_number);

-- ----------------------------------------------------------------------------
-- 2) DRINKS: catálogo de bebidas com imagem, exibido no modal do cardápio
-- ----------------------------------------------------------------------------
create table if not exists public.drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0,
  image_url text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.drinks is 'Catálogo de bebidas (com imagem) oferecidas no modal do cardápio. Gerenciado pelo Painel Administrativo.';

create index if not exists idx_drinks_active_order on public.drinks (active, display_order);

alter table public.drinks enable row level security;

create policy "qualquer um ve bebidas ativas" on public.drinks for select
  to anon, authenticated
  using (active);

create policy "admin gerencia bebidas" on public.drinks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.drinks (name, price, display_order)
values
  ('Refrigerante Lata', 6.00, 0),
  ('Refrigerante 1L', 9.00, 1)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 3) MOTOBOYS: login por telefone + PIN (hash) e sessão própria
-- ----------------------------------------------------------------------------
alter table public.motoboys add column if not exists pin_hash text;
alter table public.motoboys add column if not exists session_token uuid;
alter table public.motoboys add column if not exists session_expires_at timestamptz;

-- Admin define/reseta o PIN de um motoboy (4 a 6 dígitos, guardado só como hash).
create or replace function public.admin_set_motoboy_pin(p_motoboy_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Não autorizado';
  end if;

  if p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'O PIN deve ter entre 4 e 6 dígitos numéricos';
  end if;

  update public.motoboys
    set pin_hash = crypt(p_pin, gen_salt('bf'))
    where id = p_motoboy_id;
end;
$$;

grant execute on function public.admin_set_motoboy_pin(uuid, text) to authenticated;

-- Login do motoboy: valida telefone (ignorando formatação) + PIN, gera uma
-- nova sessão (derruba sessão anterior em outro aparelho) válida por 12h.
create or replace function public.motoboy_login(p_phone text, p_pin text)
returns table (session_token uuid, motoboy_id uuid, motoboy_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
  v_pin_hash text;
  v_token uuid;
begin
  select m.id, m.name, m.pin_hash
    into v_id, v_name, v_pin_hash
  from public.motoboys m
  where m.active
    and regexp_replace(m.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;

  if v_id is null or v_pin_hash is null or crypt(p_pin, v_pin_hash) <> v_pin_hash then
    raise exception 'Telefone ou PIN incorretos';
  end if;

  v_token := gen_random_uuid();

  update public.motoboys
    set session_token = v_token, session_expires_at = now() + interval '12 hours'
    where id = v_id;

  return query select v_token, v_id, v_name;
end;
$$;

grant execute on function public.motoboy_login(text, text) to anon, authenticated;

-- Helper privado: resolve o motoboy dono de uma sessão válida (não expirada).
create or replace function public._motoboy_from_session(p_session_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_motoboy_id uuid;
begin
  select id into v_motoboy_id
  from public.motoboys
  where session_token = p_session_token
    and session_expires_at > now()
    and active;

  if v_motoboy_id is null then
    raise exception 'Sessão inválida ou expirada. Faça login novamente.';
  end if;

  return v_motoboy_id;
end;
$$;

-- Entregas do motoboy logado (sem expor o código de confirmação — o motoboy
-- precisa perguntar o código ao cliente, não pode simplesmente vê-lo aqui).
create or replace function public.motoboy_my_deliveries(p_session_token uuid)
returns table (
  id uuid,
  order_number bigint,
  customer_name text,
  customer_phone text,
  address text,
  neighborhood text,
  reference text,
  total numeric,
  payment_method text,
  order_status text,
  created_at timestamptz,
  out_for_delivery_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_motoboy_id uuid;
begin
  v_motoboy_id := public._motoboy_from_session(p_session_token);

  return query
    select o.id, o.order_number, o.customer_name, o.customer_phone, o.address, o.neighborhood,
           o.reference, o.total, o.payment_method, o.order_status, o.created_at, o.out_for_delivery_at
    from public.orders o
    where o.motoboy_id = v_motoboy_id
      and o.order_status in ('out_for_delivery', 'delivered', 'cancelled')
    order by o.out_for_delivery_at desc nulls last, o.created_at desc
    limit 50;
end;
$$;

grant execute on function public.motoboy_my_deliveries(uuid) to anon, authenticated;

-- Núcleo do crédito de fidelidade, sem checagem de admin (só chamado
-- internamente por accrue_order_loyalty e motoboy_confirm_delivery).
create or replace function public._accrue_order_loyalty_internal(p_order_id uuid)
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
  select customer_id, loyalty_units_credited into v_customer_id, v_already_credited
  from public.orders where id = p_order_id;

  if v_customer_id is null or v_already_credited is not null then
    return;
  end if;

  select coalesce(sum(quantity), 0) into v_units from public.order_items where order_id = p_order_id;

  update public.customers
    set total_units_purchased = total_units_purchased + v_units,
        free_items_earned = floor((total_units_purchased + v_units) / 10.0)
    where id = v_customer_id;

  update public.orders set loyalty_units_credited = v_units where id = p_order_id;
end;
$$;

-- Mantém a mesma assinatura/grant de 0002, agora delegando pro helper interno.
create or replace function public.accrue_order_loyalty(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Não autorizado';
  end if;
  perform public._accrue_order_loyalty_internal(p_order_id);
end;
$$;

-- Confirmação de entrega pelo motoboy: valida sessão + código informado pelo
-- cliente. Só assim o pedido vira "delivered" (o admin ainda pode forçar
-- manualmente pelo painel como plano B).
create or replace function public.motoboy_confirm_delivery(p_session_token uuid, p_order_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_motoboy_id uuid;
  v_order_motoboy_id uuid;
  v_status text;
  v_code text;
begin
  v_motoboy_id := public._motoboy_from_session(p_session_token);

  select motoboy_id, order_status, delivery_code
    into v_order_motoboy_id, v_status, v_code
  from public.orders
  where id = p_order_id;

  if v_order_motoboy_id is null or v_order_motoboy_id <> v_motoboy_id then
    raise exception 'Pedido não encontrado para este motoboy';
  end if;

  if v_status <> 'out_for_delivery' then
    raise exception 'Este pedido não está em rota de entrega';
  end if;

  if v_code is null or v_code <> p_code then
    raise exception 'Código de confirmação incorreto';
  end if;

  update public.deliveries
    set status = 'completed', completed_at = now()
    where order_id = p_order_id and status = 'assigned';

  update public.orders
    set order_status = 'delivered'
    where id = p_order_id;

  perform public._accrue_order_loyalty_internal(p_order_id);
end;
$$;

grant execute on function public.motoboy_confirm_delivery(uuid, uuid, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4) Avaliação do motoboy pelo cliente (separada da avaliação do pedido)
-- ----------------------------------------------------------------------------
create or replace function public.submit_motoboy_rating(p_order_id uuid, p_rating smallint, p_comment text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_auth_id uuid;
  v_status text;
  v_motoboy_id uuid;
  v_already_rated timestamptz;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'A nota precisa ser entre 1 e 5';
  end if;

  select c.auth_user_id, o.order_status, o.motoboy_id, o.motoboy_rated_at
    into v_owner_auth_id, v_status, v_motoboy_id, v_already_rated
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where o.id = p_order_id;

  if v_owner_auth_id is null or v_owner_auth_id <> auth.uid() then
    raise exception 'Não autorizado';
  end if;

  if v_motoboy_id is null then
    raise exception 'Este pedido não tem motoboy associado';
  end if;

  if v_status <> 'delivered' then
    raise exception 'Só é possível avaliar entregas já concluídas';
  end if;

  if v_already_rated is not null then
    raise exception 'Esta entrega já foi avaliada';
  end if;

  update public.orders
    set motoboy_rating = p_rating, motoboy_rating_comment = p_comment, motoboy_rated_at = now()
    where id = p_order_id;
end;
$$;

grant execute on function public.submit_motoboy_rating(uuid, smallint, text) to authenticated;
