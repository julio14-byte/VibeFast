-- ============================================================
-- 023 · Factura global diaria + ventas pendientes de facturar
-- ============================================================

alter table public.ventas
  add column if not exists factura_id uuid references public.facturas (id) on delete set null;

create index if not exists ventas_factura_id_idx on public.ventas (factura_id);

create index if not exists ventas_org_sin_facturar_idx
  on public.ventas (organization_id, created_at desc)
  where factura_id is null;

alter table public.facturas
  add column if not exists es_global boolean not null default false;

alter table public.facturas
  add column if not exists periodo_fecha date;

alter table public.facturas
  add column if not exists ventas_incluidas integer not null default 0;

comment on column public.ventas.factura_id is
  'Factura CFDI que cubre esta venta (individual o global).';

comment on column public.facturas.es_global is
  'True = factura global SAT a público en general (varias ventas del periodo).';

comment on column public.facturas.periodo_fecha is
  'Día (o periodo) que agrupa la factura global.';
