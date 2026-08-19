-- ============================================================================
-- Migration 0009: corrige a policy de RLS que permite ao visitante (anon)
-- criar pedidos e itens de pedido pelo checkout do site.
--
-- Sintoma: POST /rest/v1/orders retornava 401 com
--   {"code":"42501","message":"new row violates row-level security policy
--   for table \"orders\""}
-- Causa provável: RLS foi habilitado na tabela sem que as policies de
-- 0001_init.sql tivessem sido de fato criadas (ex: via toggle "Enable RLS"
-- no painel do Supabase). Este script recria as policies de forma idempotente.
-- ============================================================================

drop policy if exists "anon pode criar pedidos" on public.orders;
create policy "anon pode criar pedidos"
  on public.orders for insert
  to anon
  with check (true);

drop policy if exists "anon pode criar itens do pedido" on public.order_items;
create policy "anon pode criar itens do pedido"
  on public.order_items for insert
  to anon
  with check (true);
