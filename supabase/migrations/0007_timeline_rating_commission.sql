-- ============================================================================
-- Migration 0007: linha do tempo do pedido, avaliação do cliente (1-5 estrelas
-- + justificativa) e comissão percentual do admin master sobre as vendas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Linha do tempo: faltava registrar quando o pedido entrou em preparo
-- ----------------------------------------------------------------------------
alter table public.orders add column if not exists preparing_at timestamptz;

create or replace function public.touch_order_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.order_status = 'preparing' and old.order_status is distinct from 'preparing' then
    new.preparing_at = now();
  end if;
  if new.order_status = 'out_for_delivery' and old.order_status is distinct from 'out_for_delivery' then
    new.out_for_delivery_at = now();
  end if;
  if new.order_status = 'delivered' and old.order_status is distinct from 'delivered' then
    new.delivered_at = now();
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2) Avaliação do cliente (1 a 5 estrelas + justificativa)
-- ----------------------------------------------------------------------------
alter table public.orders add column if not exists rating smallint check (rating between 1 and 5);
alter table public.orders add column if not exists rating_comment text;
alter table public.orders add column if not exists rated_at timestamptz;

-- Função segura: só o próprio cliente avalia o próprio pedido, só depois de
-- entregue, e só uma vez (não deixa sobrescrever nota já dada).
create or replace function public.submit_order_rating(p_order_id uuid, p_rating smallint, p_comment text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_auth_id uuid;
  v_status text;
  v_already_rated timestamptz;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'A nota precisa ser entre 1 e 5';
  end if;

  select c.auth_user_id, o.order_status, o.rated_at
    into v_owner_auth_id, v_status, v_already_rated
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where o.id = p_order_id;

  if v_owner_auth_id is null or v_owner_auth_id <> auth.uid() then
    raise exception 'Não autorizado';
  end if;

  if v_status <> 'delivered' then
    raise exception 'Só é possível avaliar pedidos já entregues';
  end if;

  if v_already_rated is not null then
    raise exception 'Este pedido já foi avaliado';
  end if;

  update public.orders
    set rating = p_rating, rating_comment = p_comment, rated_at = now()
    where id = p_order_id;
end;
$$;

grant execute on function public.submit_order_rating(uuid, smallint, text) to authenticated;

-- Relatório de avaliações por período (mesma lógica dos outros relatórios do CRM)
create or replace function public.ratings_summary(p_start date, p_end date)
returns table (
  rating_count bigint,
  avg_rating numeric
)
language sql
stable
as $$
  select
    count(*)::bigint as rating_count,
    coalesce(round(avg(rating)::numeric, 2), 0) as avg_rating
  from public.orders
  where rated_at is not null
    and rated_at::date between p_start and p_end;
$$;

grant execute on function public.ratings_summary(date, date) to authenticated;

-- ----------------------------------------------------------------------------
-- 3) Comissão do admin master (dono do sistema) sobre as vendas
-- ----------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id smallint primary key default 1 check (id = 1), -- linha única (singleton)
  commission_percent numeric(5,2) not null default 10.00 check (commission_percent between 0 and 100),
  master_admin_name text,
  updated_at timestamptz not null default now()
);

comment on table public.platform_settings is
  'Configuração única do sistema. commission_percent é o percentual de tudo que for vendido '
  'destinado ao admin master (dono do sistema/plataforma), não ao dono da loja.';

insert into public.platform_settings (id, commission_percent, master_admin_name)
values (1, 10.00, 'Admin Master')
on conflict (id) do nothing;

create or replace function public.touch_platform_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_platform_settings on public.platform_settings;
create trigger trg_touch_platform_settings
  before update on public.platform_settings
  for each row execute function public.touch_platform_settings_updated_at();

alter table public.platform_settings enable row level security;

create policy "admin gerencia configuracoes da plataforma" on public.platform_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
