-- ═══════════════════════════════════════════════════════════════════
--  POKEVAULT — Supabase SQL Setup
--  Run this entire script once in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Cards table ────────────────────────────────────────────────
create table if not exists public.cards (
  id             text        primary key,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  name           text        not null,
  set_name       text,
  type           text,
  grade          text        not null default 'raw',
  quantity       integer     not null default 1,
  purchase_price numeric     not null default 0,
  purchase_date  text,
  target_price   numeric,
  notes          text,
  current_value  numeric,
  last_updated   bigint,
  url            text,
  price_history  jsonb       not null default '[]'::jsonb,
  sold           boolean     not null default false,
  sold_price     numeric,
  sold_date      text,
  sold_to        text,
  created_at     timestamptz not null default now()
);

-- Index for fast per-user lookups
create index if not exists cards_user_id_idx on public.cards(user_id);

-- ── 2. Row Level Security ─────────────────────────────────────────
alter table public.cards enable row level security;

-- Users can only read their own cards
create policy "Users can view own cards"
  on public.cards for select
  using (auth.uid() = user_id);

-- Users can only insert cards for themselves
create policy "Users can insert own cards"
  on public.cards for insert
  with check (auth.uid() = user_id);

-- Users can only update their own cards
create policy "Users can update own cards"
  on public.cards for update
  using (auth.uid() = user_id);

-- Users can only delete their own cards
create policy "Users can delete own cards"
  on public.cards for delete
  using (auth.uid() = user_id);

-- ── 3. Portfolio snapshots (for Stats page history chart) ─────────
create table if not exists public.portfolio_snapshots (
  id         bigserial   primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  snap_date  text        not null,   -- 'YYYY-MM-DD'
  total_value numeric    not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snap_date)
);

create index if not exists snapshots_user_idx on public.portfolio_snapshots(user_id);

alter table public.portfolio_snapshots enable row level security;

create policy "Users can view own snapshots"
  on public.portfolio_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert own snapshots"
  on public.portfolio_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users can update own snapshots"
  on public.portfolio_snapshots for update
  using (auth.uid() = user_id);

create policy "Users can delete own snapshots"
  on public.portfolio_snapshots for delete
  using (auth.uid() = user_id);
