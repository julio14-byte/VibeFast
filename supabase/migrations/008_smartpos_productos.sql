-- ============================================================
-- 008 · SmartPOS · productos
-- ------------------------------------------------------------
-- Reemplaza core_items por la entidad principal de SmartPOS:
-- catálogo de productos con inventario por comercio.
-- ============================================================

-- Eliminar tabla genérica del MVP (y sus policies)
drop policy if exists "core_items_delete_own" on public.core_items;
drop policy if exists "core_items_update_own" on public.core_items;
drop policy if exists "core_items_insert_own" on public.core_items;
drop policy if exists "core_items_select_own" on public.core_items;

drop trigger if exists core_items_set_updated_at on public.core_items;
drop table if exists public.core_items;

-- ------------------------------------------------------------
-- productos
-- ------------------------------------------------------------
create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  nombre      text not null,
  codigo      text not null,
  precio      numeric(10, 2) not null default 0 check (precio >= 0),
  stock       integer not null default 0 check (stock >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.productos is 'Catálogo de productos e inventario por comercio (SmartPOS).';

create index if not exists productos_user_id_idx on public.productos (user_id, created_at desc);
create unique index if not exists productos_user_codigo_idx on public.productos (user_id, codigo);

drop trigger if exists productos_set_updated_at on public.productos;
create trigger productos_set_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();

-- RLS
alter table public.productos enable row level security;

drop policy if exists "productos_select_own" on public.productos;
create policy "productos_select_own"
  on public.productos for select
  using (auth.uid() = user_id);

drop policy if exists "productos_insert_own" on public.productos;
create policy "productos_insert_own"
  on public.productos for insert
  with check (auth.uid() = user_id);

drop policy if exists "productos_update_own" on public.productos;
create policy "productos_update_own"
  on public.productos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "productos_delete_own" on public.productos;
create policy "productos_delete_own"
  on public.productos for delete
  using (auth.uid() = user_id);
