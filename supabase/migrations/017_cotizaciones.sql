-- ============================================================
-- 017 · Cotizaciones (presupuestos) → ventas / facturas
-- ============================================================

create table if not exists public.cotizaciones (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  cliente_id          uuid references public.clientes (id) on delete set null,
  folio               integer not null,
  estado              text not null default 'borrador'
    check (estado in ('borrador', 'enviada', 'convertida', 'rechazada', 'vencida')),
  tipo_precio         text not null default 'publico'
    check (tipo_precio in ('publico', 'mayoreo')),
  subtotal            numeric(12, 2) not null default 0,
  iva                 numeric(12, 2) not null default 0,
  total               numeric(12, 2) not null default 0,
  forma_pago          text not null default '01',
  notas               text,
  validez_dias        integer not null default 7 check (validez_dias > 0),
  vence_at            timestamptz not null default (now() + interval '7 days'),
  telefono_whatsapp  text,
  whatsapp_enviado_at timestamptz,
  venta_id            uuid references public.ventas (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.cotizaciones is 'Cotizaciones / presupuestos antes de cobrar venta.';

create unique index if not exists cotizaciones_user_folio_idx
  on public.cotizaciones (user_id, folio);

create index if not exists cotizaciones_user_estado_idx
  on public.cotizaciones (user_id, estado, created_at desc);

create index if not exists cotizaciones_venta_id_idx
  on public.cotizaciones (venta_id);

drop trigger if exists cotizaciones_set_updated_at on public.cotizaciones;
create trigger cotizaciones_set_updated_at
  before update on public.cotizaciones
  for each row execute function public.set_updated_at();

alter table public.cotizaciones enable row level security;

drop policy if exists "cotizaciones_select_own" on public.cotizaciones;
create policy "cotizaciones_select_own"
  on public.cotizaciones for select using (auth.uid() = user_id);

drop policy if exists "cotizaciones_insert_own" on public.cotizaciones;
create policy "cotizaciones_insert_own"
  on public.cotizaciones for insert with check (auth.uid() = user_id);

drop policy if exists "cotizaciones_update_own" on public.cotizaciones;
create policy "cotizaciones_update_own"
  on public.cotizaciones for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cotizaciones_delete_own" on public.cotizaciones;
create policy "cotizaciones_delete_own"
  on public.cotizaciones for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- cotizacion_items
-- ------------------------------------------------------------
create table if not exists public.cotizacion_items (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones (id) on delete cascade,
  producto_id     uuid references public.productos (id) on delete set null,
  codigo          bigint not null,
  nombre          text not null,
  cantidad        integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0),
  subtotal        numeric(12, 2) not null check (subtotal >= 0)
);

comment on table public.cotizacion_items is 'Líneas de una cotización (snapshot de precios).';

create index if not exists cotizacion_items_cotizacion_id_idx
  on public.cotizacion_items (cotizacion_id);

alter table public.cotizacion_items enable row level security;

drop policy if exists "cotizacion_items_select_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_select_via_cotizacion"
  on public.cotizacion_items for select
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "cotizacion_items_insert_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_insert_via_cotizacion"
  on public.cotizacion_items for insert
  with check (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "cotizacion_items_update_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_update_via_cotizacion"
  on public.cotizacion_items for update
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "cotizacion_items_delete_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_delete_via_cotizacion"
  on public.cotizacion_items for delete
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id and c.user_id = auth.uid()
    )
  );

-- Trazabilidad venta ← cotización
alter table public.ventas
  add column if not exists cotizacion_id uuid references public.cotizaciones (id) on delete set null;

create index if not exists ventas_cotizacion_id_idx on public.ventas (cotizacion_id);
