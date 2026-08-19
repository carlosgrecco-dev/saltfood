-- ============================================================================
-- Acarajé O Abençoado — Delivery completo
-- Migration 0003: promoções do carrossel do Hero
-- Rode depois de 0001 e 0002.
-- ============================================================================

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text, -- opcional: para onde vai ao tocar (ex: link de um produto/whatsapp). Vazio = rola até o cardápio.
  badge_label text, -- opcional: selo pequeno, ex: "Só hoje", "Promoção"
  display_order integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.promotions is 'Slides do carrossel de promoções exibido no Hero. Gerenciado pelo Painel Administrativo.';

create index if not exists idx_promotions_active_order on public.promotions (active, display_order);

alter table public.promotions enable row level security;

-- Leitura pública (qualquer visitante do site vê as promoções ativas e dentro do período)
create policy "qualquer um ve promocoes ativas" on public.promotions for select
  to anon, authenticated
  using (
    active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- Admin enxerga e gerencia tudo (inclusive inativas/agendadas)
create policy "admin gerencia promocoes" on public.promotions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter publication supabase_realtime add table public.promotions;
