-- ============================================================
-- 020 · Margen mayoreo en productos + cliente Público en general
-- ============================================================

alter table public.productos
  add column if not exists margen_mayoreo numeric(6, 2)
    check (margen_mayoreo is null or (margen_mayoreo >= 0 and margen_mayoreo <= 1000));

comment on column public.productos.margen_mayoreo is
  'Margen (%) sobre compra sin IVA para calcular precio mayoreo.';

update public.productos
set margen_mayoreo = round(margen_ganancia * 0.85, 2)
where margen_mayoreo is null
  and margen_ganancia is not null;

alter table public.clientes
  add column if not exists es_publico_general boolean not null default false;

comment on column public.clientes.es_publico_general is
  'Cliente genérico SAT (XAXX010101000) para ventas de mostrador.';

create unique index if not exists clientes_user_publico_general_idx
  on public.clientes (user_id)
  where es_publico_general = true;
