-- ============================================================
-- SmartPOS · alinear productos al schema de la app
-- ------------------------------------------------------------
-- En algunos proyectos la tabla productos quedó con columnas
-- legacy (sku, existencia, estatus). Esta migración las renombra
-- a codigo/stock y deja codigo como bigint.
-- ============================================================

do $$
begin
  -- sku → codigo
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'sku'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'codigo'
  ) then
    alter table public.productos rename column sku to codigo;
  end if;

  -- existencia → stock
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'existencia'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'stock'
  ) then
    alter table public.productos rename column existencia to stock;
  end if;

  -- quitar columna legacy
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'estatus'
  ) then
    alter table public.productos drop column estatus;
  end if;
end $$;

-- codigo numérico (desde text/sku renombrado)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'productos' and column_name = 'codigo'
      and data_type in ('text', 'character varying')
  ) then
    alter table public.productos
      alter column codigo type bigint using codigo::bigint;
  end if;
end $$;

alter table public.productos
  alter column codigo set not null;

alter table public.productos
  alter column stock set default 0;

alter table public.productos
  alter column stock set not null;

create unique index if not exists productos_user_codigo_idx
  on public.productos (user_id, codigo);

comment on column public.productos.codigo is 'Código numérico del producto (único por comercio).';
