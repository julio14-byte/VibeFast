-- ============================================================
-- 028 · Ampliar rango de márgenes (productos baratos, costo bajo)
-- ------------------------------------------------------------
-- Ej. costo $0.10, público $4 → margen menudeo ≈ 3348%
-- numeric(6,2) y el tope 1000% no alcanzan en ferretería.
-- ============================================================

alter table public.productos
  alter column margen_ganancia type numeric(10, 2),
  alter column margen_mayoreo type numeric(10, 2);

alter table public.productos
  drop constraint if exists productos_margen_ganancia_check;

alter table public.productos
  drop constraint if exists productos_margen_mayoreo_check;

alter table public.productos
  add constraint productos_margen_ganancia_check
    check (margen_ganancia >= -100 and margen_ganancia <= 99999999.99);

alter table public.productos
  add constraint productos_margen_mayoreo_check
    check (
      margen_mayoreo is null
      or (margen_mayoreo >= -100 and margen_mayoreo <= 99999999.99)
    );

comment on column public.productos.margen_ganancia is
  'Margen % menudeo sobre costo sin IVA (calculado desde precio público con IVA).';

comment on column public.productos.margen_mayoreo is
  'Margen % mayoreo sobre costo sin IVA (calculado desde precio mayoreo con IVA).';

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
