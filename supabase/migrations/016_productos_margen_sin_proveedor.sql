-- ============================================================
-- 016 · Margen de ganancia y comentarios de precios con/sin IVA
-- ------------------------------------------------------------
-- precio_compra sin IVA; precio_publico y precio_mayoreo con IVA.
-- proveedor_id se deja en tabla pero ya no se usa en UI.
-- ============================================================

alter table public.productos
  add column if not exists margen_ganancia numeric(6, 2) not null default 30
    check (margen_ganancia >= 0 and margen_ganancia <= 1000);

comment on column public.productos.margen_ganancia is
  'Porcentaje de margen sobre precio de compra (sin IVA) para calcular precios de venta.';

comment on column public.productos.precio_compra is
  'Precio de compra sin IVA (costo al proveedor).';

comment on column public.productos.precio_publico is
  'Precio de venta al público (menudeo), con IVA incluido.';

comment on column public.productos.precio_mayoreo is
  'Precio de venta mayoreo, con IVA incluido.';
