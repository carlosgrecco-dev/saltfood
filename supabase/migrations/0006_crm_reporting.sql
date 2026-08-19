-- ============================================================================
-- Migration 0006: funções de relatório para o CRM do Painel Administrativo
--
-- Todas usam SECURITY INVOKER (padrão) e dependem só da RLS das tabelas
-- (orders/order_items/deliveries/motoboys já restringem SELECT a admins),
-- então são seguras mesmo expostas para "authenticated": um não-admin
-- simplesmente recebe zero linhas.
-- ============================================================================

-- Vendas agrupadas por forma de pagamento, num período. Considera "venda"
-- todo pedido com order_status = 'delivered' (entregue = venda concluída).
create or replace function public.sales_summary_by_payment(p_start date, p_end date)
returns table (
  payment_method text,
  order_count bigint,
  total_amount numeric,
  units_sold bigint
)
language sql
stable
as $$
  select
    o.payment_method,
    count(distinct o.id)::bigint as order_count,
    coalesce(sum(o.total), 0)::numeric as total_amount,
    coalesce(sum(oi.quantity), 0)::bigint as units_sold
  from public.orders o
  left join public.order_items oi on oi.order_id = o.id
  where o.order_status = 'delivered'
    and o.delivered_at::date between p_start and p_end
  group by o.payment_method;
$$;

-- Vendas por dia, num período (para o gráfico de barras).
create or replace function public.sales_daily(p_start date, p_end date)
returns table (
  sale_date date,
  order_count bigint,
  total_amount numeric,
  units_sold bigint
)
language sql
stable
as $$
  select
    o.delivered_at::date as sale_date,
    count(distinct o.id)::bigint as order_count,
    coalesce(sum(o.total), 0)::numeric as total_amount,
    coalesce(sum(oi.quantity), 0)::bigint as units_sold
  from public.orders o
  left join public.order_items oi on oi.order_id = o.id
  where o.order_status = 'delivered'
    and o.delivered_at::date between p_start and p_end
  group by o.delivered_at::date
  order by sale_date;
$$;

-- Fechamento de motoboys agregado num período (semana/mês/personalizado),
-- em vez de só por noite como a view motoboy_nightly_closing.
create or replace function public.motoboy_period_closing(p_start date, p_end date)
returns table (
  motoboy_id uuid,
  motoboy_name text,
  corridas_concluidas bigint,
  corridas_canceladas bigint,
  total_a_pagar numeric
)
language sql
stable
as $$
  select
    d.motoboy_id,
    m.name as motoboy_name,
    count(*) filter (where d.status = 'completed')::bigint as corridas_concluidas,
    count(*) filter (where d.status = 'cancelled')::bigint as corridas_canceladas,
    coalesce(sum(d.fee) filter (where d.status = 'completed'), 0)::numeric as total_a_pagar
  from public.deliveries d
  join public.motoboys m on m.id = d.motoboy_id
  where d.shift_date between p_start and p_end
  group by d.motoboy_id, m.name
  order by m.name;
$$;

grant execute on function public.sales_summary_by_payment(date, date) to authenticated;
grant execute on function public.sales_daily(date, date) to authenticated;
grant execute on function public.motoboy_period_closing(date, date) to authenticated;
