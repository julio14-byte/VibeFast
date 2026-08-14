-- ============================================================
-- 015 · Cliente con precio mayoreo en ventas
-- ------------------------------------------------------------
-- Checkbox al registrar cliente: aplica precio mayoreo vs público.
-- ============================================================

alter table public.clientes
  add column if not exists usa_precio_mayoreo boolean not null default false;

comment on column public.clientes.usa_precio_mayoreo is
  'Si es true, las ventas a este cliente usan precio mayoreo del catálogo; si false, precio público (menudeo).';
