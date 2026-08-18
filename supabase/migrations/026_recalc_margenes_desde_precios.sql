-- ============================================================
-- 026 · Recalcular márgenes desde costo y precios con IVA
-- ------------------------------------------------------------
-- NOTA: Si falla por productos_margen_mayoreo_check, ejecuta antes
-- la migración 027_margenes_negativos_recalc.sql (permite márgenes negativos).
-- ============================================================

update public.productos
set
  margen_ganancia = round(
    (
      ((precio_publico / 1.16) / nullif(precio_compra, 0)) - 1
    ) * 100,
    2
  ),
  margen_mayoreo = round(
    (
      ((precio_mayoreo / 1.16) / nullif(precio_compra, 0)) - 1
    ) * 100,
    2
  )
where precio_compra > 0
  and (precio_publico > 0 or precio_mayoreo > 0);

comment on column public.productos.margen_ganancia is
  'Margen % menudeo sobre costo sin IVA, calculado desde precio_publico con IVA.';

comment on column public.productos.margen_mayoreo is
  'Margen % mayoreo sobre costo sin IVA, calculado desde precio_mayoreo con IVA.';
