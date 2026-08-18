-- ============================================================
-- 027 · Permitir márgenes negativos y recalcular desde precios
-- ------------------------------------------------------------
-- Algunos productos tienen precio mayoreo menor al costo (+ IVA).
-- Ej. costo 130, mayoreo 145 → margen mayoreo ≈ -3.85%
-- ============================================================

alter table public.productos
  drop constraint if exists productos_margen_ganancia_check;

alter table public.productos
  drop constraint if exists productos_margen_mayoreo_check;

alter table public.productos
  add constraint productos_margen_ganancia_check
    check (margen_ganancia >= -100 and margen_ganancia <= 1000);

alter table public.productos
  add constraint productos_margen_mayoreo_check
    check (
      margen_mayoreo is null
      or (margen_mayoreo >= -100 and margen_mayoreo <= 1000)
    );

comment on column public.productos.margen_ganancia is
  'Margen % menudeo sobre costo sin IVA (puede ser negativo si vendes por debajo del costo).';

comment on column public.productos.margen_mayoreo is
  'Margen % mayoreo sobre costo sin IVA (puede ser negativo si vendes por debajo del costo).';

update public.productos
set
  margen_ganancia = round(
    (
      ((coalesce(precio_publico, precio, 0) / 1.16) / nullif(precio_compra, 0)) - 1
    ) * 100,
    2
  ),
  margen_mayoreo = case
    when precio_mayoreo > 0 and precio_compra > 0 then round(
      (((precio_mayoreo / 1.16) / precio_compra) - 1) * 100,
      2
    )
    else margen_mayoreo
  end
where precio_compra > 0
  and (coalesce(precio_publico, precio, 0) > 0 or precio_mayoreo > 0);
