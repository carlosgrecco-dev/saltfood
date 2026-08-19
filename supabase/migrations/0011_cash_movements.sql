-- ============================================================================
-- Migration 0011: saídas e sangrias do caixa (fechamento de caixa)
-- ============================================================================

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('saida', 'sangria')),
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  shift_date date not null default current_date,
  created_at timestamptz not null default now()
);

comment on table public.cash_movements is 'Saídas (despesas pagas pelo caixa) e sangrias (retirada de dinheiro do caixa), por noite de referência (shift_date).';

create index if not exists idx_cash_movements_shift on public.cash_movements (shift_date);

alter table public.cash_movements enable row level security;

create policy "admin gerencia movimentos de caixa" on public.cash_movements for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter publication supabase_realtime add table public.cash_movements;
