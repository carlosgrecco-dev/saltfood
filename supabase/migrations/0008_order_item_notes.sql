-- ============================================================================
-- Observações por item do pedido (ex: "sem cebola", "bem passado"),
-- preenchidas no modal do cardápio e distintas das observações gerais
-- do pedido (orders.notes, preenchida no checkout).
-- ============================================================================

alter table public.order_items
  add column if not exists notes text;
