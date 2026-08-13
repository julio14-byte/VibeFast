-- ============================================================
-- 009 · SmartPOS Ferretería · ventas, proveedores, facturación SAT
-- ------------------------------------------------------------
-- Extiende productos con precios múltiples y proveedor.
-- Agrega módulos de ventas, clientes y facturación electrónica.
-- ============================================================

-- ------------------------------------------------------------
-- proveedores
-- ------------------------------------------------------------
create table if not exists public.proveedores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  nombre      text not null,
  contacto    text,
  telefono    text,
  email       text,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.proveedores is 'Proveedores de productos para ferretería.';

create index if not exists proveedores_user_id_idx on public.proveedores (user_id, nombre);

drop trigger if exists proveedores_set_updated_at on public.proveedores;
create trigger proveedores_set_updated_at
  before update on public.proveedores
  for each row execute function public.set_updated_at();

alter table public.proveedores enable row level security;

drop policy if exists "proveedores_select_own" on public.proveedores;
create policy "proveedores_select_own"
  on public.proveedores for select using (auth.uid() = user_id);

drop policy if exists "proveedores_insert_own" on public.proveedores;
create policy "proveedores_insert_own"
  on public.proveedores for insert with check (auth.uid() = user_id);

drop policy if exists "proveedores_update_own" on public.proveedores;
create policy "proveedores_update_own"
  on public.proveedores for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "proveedores_delete_own" on public.proveedores;
create policy "proveedores_delete_own"
  on public.proveedores for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- productos · campos extendidos
-- ------------------------------------------------------------
alter table public.productos
  add column if not exists precio_compra numeric(10, 2) not null default 0
    check (precio_compra >= 0);

alter table public.productos
  add column if not exists precio_mayoreo numeric(10, 2) not null default 0
    check (precio_mayoreo >= 0);

alter table public.productos
  add column if not exists precio_publico numeric(10, 2) not null default 0
    check (precio_publico >= 0);

alter table public.productos
  add column if not exists proveedor_id uuid references public.proveedores (id) on delete set null;

alter table public.productos
  add column if not exists clave_sat text not null default '01010101';

alter table public.productos
  add column if not exists unidad_sat text not null default 'H87';

-- Migrar precio existente a precio_publico si aplica
update public.productos
set precio_publico = precio
where precio_publico = 0 and precio > 0;

comment on column public.productos.precio_compra is 'Precio de compra al proveedor.';
comment on column public.productos.precio_mayoreo is 'Precio de venta mayoreo.';
comment on column public.productos.precio_publico is 'Precio de venta al público.';
comment on column public.productos.clave_sat is 'Clave de producto/servicio SAT (catálogo CFDI).';
comment on column public.productos.unidad_sat is 'Clave de unidad SAT (ej. H87 = pieza).';

create index if not exists productos_proveedor_id_idx on public.productos (proveedor_id);
create index if not exists productos_nombre_idx on public.productos (user_id, nombre);

-- ------------------------------------------------------------
-- empresa_fiscal · datos del emisor para CFDI
-- ------------------------------------------------------------
create table if not exists public.empresa_fiscal (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users (id) on delete cascade,
  rfc             text not null default '',
  razon_social    text not null default '',
  regimen_fiscal  text not null default '612',
  codigo_postal   text not null default '',
  direccion       text,
  serie_factura   text not null default 'A',
  folio_actual    integer not null default 1,
  certificado_csd text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.empresa_fiscal is 'Datos fiscales del comercio para facturación electrónica SAT.';

drop trigger if exists empresa_fiscal_set_updated_at on public.empresa_fiscal;
create trigger empresa_fiscal_set_updated_at
  before update on public.empresa_fiscal
  for each row execute function public.set_updated_at();

alter table public.empresa_fiscal enable row level security;

drop policy if exists "empresa_fiscal_select_own" on public.empresa_fiscal;
create policy "empresa_fiscal_select_own"
  on public.empresa_fiscal for select using (auth.uid() = user_id);

drop policy if exists "empresa_fiscal_insert_own" on public.empresa_fiscal;
create policy "empresa_fiscal_insert_own"
  on public.empresa_fiscal for insert with check (auth.uid() = user_id);

drop policy if exists "empresa_fiscal_update_own" on public.empresa_fiscal;
create policy "empresa_fiscal_update_own"
  on public.empresa_fiscal for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- clientes
-- ------------------------------------------------------------
create table if not exists public.clientes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  nombre          text not null,
  rfc             text not null default 'XAXX010101000',
  email           text,
  telefono        text,
  codigo_postal   text,
  regimen_fiscal  text not null default '616',
  uso_cfdi        text not null default 'G03',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.clientes is 'Clientes para ventas y facturación.';

create index if not exists clientes_user_id_idx on public.clientes (user_id, nombre);

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

alter table public.clientes enable row level security;

drop policy if exists "clientes_select_own" on public.clientes;
create policy "clientes_select_own"
  on public.clientes for select using (auth.uid() = user_id);

drop policy if exists "clientes_insert_own" on public.clientes;
create policy "clientes_insert_own"
  on public.clientes for insert with check (auth.uid() = user_id);

drop policy if exists "clientes_update_own" on public.clientes;
create policy "clientes_update_own"
  on public.clientes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "clientes_delete_own" on public.clientes;
create policy "clientes_delete_own"
  on public.clientes for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- ventas
-- ------------------------------------------------------------
create table if not exists public.ventas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  cliente_id      uuid references public.clientes (id) on delete set null,
  folio           integer not null,
  tipo_precio     text not null default 'publico'
    check (tipo_precio in ('publico', 'mayoreo')),
  subtotal        numeric(12, 2) not null default 0 check (subtotal >= 0),
  iva             numeric(12, 2) not null default 0 check (iva >= 0),
  total           numeric(12, 2) not null default 0 check (total >= 0),
  forma_pago      text not null default '01',
  metodo_pago     text not null default 'PUE',
  notas           text,
  created_at      timestamptz not null default now()
);

comment on table public.ventas is 'Ventas registradas en el mostrador.';
comment on column public.ventas.forma_pago is 'Catálogo SAT forma de pago (01=efectivo).';
comment on column public.ventas.metodo_pago is 'PUE o PPD.';

create index if not exists ventas_user_id_idx on public.ventas (user_id, created_at desc);
create unique index if not exists ventas_user_folio_idx on public.ventas (user_id, folio);

alter table public.ventas enable row level security;

drop policy if exists "ventas_select_own" on public.ventas;
create policy "ventas_select_own"
  on public.ventas for select using (auth.uid() = user_id);

drop policy if exists "ventas_insert_own" on public.ventas;
create policy "ventas_insert_own"
  on public.ventas for insert with check (auth.uid() = user_id);

drop policy if exists "ventas_update_own" on public.ventas;
create policy "ventas_update_own"
  on public.ventas for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ventas_delete_own" on public.ventas;
create policy "ventas_delete_own"
  on public.ventas for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- venta_items
-- ------------------------------------------------------------
create table if not exists public.venta_items (
  id              uuid primary key default gen_random_uuid(),
  venta_id        uuid not null references public.ventas (id) on delete cascade,
  producto_id     uuid references public.productos (id) on delete set null,
  codigo          bigint not null,
  nombre          text not null,
  cantidad        integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0),
  subtotal        numeric(12, 2) not null check (subtotal >= 0)
);

comment on table public.venta_items is 'Líneas de detalle de cada venta.';

create index if not exists venta_items_venta_id_idx on public.venta_items (venta_id);

alter table public.venta_items enable row level security;

drop policy if exists "venta_items_select_own" on public.venta_items;
create policy "venta_items_select_own"
  on public.venta_items for select
  using (
    exists (
      select 1 from public.ventas v
      where v.id = venta_id and v.user_id = auth.uid()
    )
  );

drop policy if exists "venta_items_insert_own" on public.venta_items;
create policy "venta_items_insert_own"
  on public.venta_items for insert
  with check (
    exists (
      select 1 from public.ventas v
      where v.id = venta_id and v.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- facturas · CFDI
-- ------------------------------------------------------------
create table if not exists public.facturas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  venta_id        uuid references public.ventas (id) on delete set null,
  cliente_id      uuid references public.clientes (id) on delete set null,
  serie           text not null,
  folio           integer not null,
  uuid_cfdi       text,
  rfc_emisor      text not null,
  rfc_receptor    text not null,
  subtotal        numeric(12, 2) not null default 0,
  iva             numeric(12, 2) not null default 0,
  total           numeric(12, 2) not null default 0,
  uso_cfdi        text not null default 'G03',
  forma_pago      text not null default '01',
  metodo_pago     text not null default 'PUE',
  estado          text not null default 'pendiente'
    check (estado in ('pendiente', 'timbrada', 'cancelada')),
  xml_cfdi        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.facturas is 'Facturas electrónicas CFDI 4.0 generadas.';

create index if not exists facturas_user_id_idx on public.facturas (user_id, created_at desc);
create unique index if not exists facturas_user_serie_folio_idx
  on public.facturas (user_id, serie, folio);

drop trigger if exists facturas_set_updated_at on public.facturas;
create trigger facturas_set_updated_at
  before update on public.facturas
  for each row execute function public.set_updated_at();

alter table public.facturas enable row level security;

drop policy if exists "facturas_select_own" on public.facturas;
create policy "facturas_select_own"
  on public.facturas for select using (auth.uid() = user_id);

drop policy if exists "facturas_insert_own" on public.facturas;
create policy "facturas_insert_own"
  on public.facturas for insert with check (auth.uid() = user_id);

drop policy if exists "facturas_update_own" on public.facturas;
create policy "facturas_update_own"
  on public.facturas for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "facturas_delete_own" on public.facturas;
create policy "facturas_delete_own"
  on public.facturas for delete using (auth.uid() = user_id);
