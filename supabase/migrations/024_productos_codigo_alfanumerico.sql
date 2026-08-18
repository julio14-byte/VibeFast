-- ============================================================
-- 024 · Código de producto alfanumérico (text)
-- ------------------------------------------------------------
-- Permite SKUs como BDLI018 además de códigos numéricos.
-- ============================================================

drop index if exists public.productos_codigo_text_idx;

alter table public.productos
  drop column if exists codigo_text;

alter table public.productos
  alter column codigo type text using codigo::text;

alter table public.productos
  alter column codigo set not null;

comment on column public.productos.codigo is
  'Código del producto (alfanumérico, único por organización).';

-- Snapshots en ventas y cotizaciones
alter table public.venta_items
  alter column codigo type text using codigo::text;

alter table public.cotizacion_items
  alter column codigo type text using codigo::text;

-- Índice único (organization_id, codigo) ya existe desde 021
