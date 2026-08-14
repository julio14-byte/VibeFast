-- ============================================================
-- 014 · Búsqueda por código (bigint) como texto
-- ------------------------------------------------------------
-- Permite ILIKE en código sin error "bigint ~~* unknown".
-- ============================================================

alter table public.productos
  add column if not exists codigo_text text generated always as (codigo::text) stored;

create index if not exists productos_codigo_text_idx
  on public.productos (codigo_text);

comment on column public.productos.codigo_text is 'Código como texto para búsqueda parcial (generado).';
