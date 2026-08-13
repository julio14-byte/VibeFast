-- ============================================================
-- 010 · Clientes extendidos, PAC sandbox y tickets
-- ============================================================

-- Clientes: razón social y dirección para CFDI
alter table public.clientes
  add column if not exists razon_social text;

alter table public.clientes
  add column if not exists direccion text;

update public.clientes
set razon_social = nombre
where razon_social is null or razon_social = '';

comment on column public.clientes.razon_social is 'Razón social para facturación electrónica.';
comment on column public.clientes.direccion is 'Dirección fiscal del cliente.';

-- PAC sandbox en empresa fiscal
alter table public.empresa_fiscal
  add column if not exists pac_provider text not null default 'sandbox';

alter table public.empresa_fiscal
  add column if not exists pac_mode text not null default 'sandbox'
    check (pac_mode in ('sandbox', 'production'));

alter table public.empresa_fiscal
  add column if not exists pac_sandbox_url text not null default 'https://sandbox.facturama.mx';

alter table public.empresa_fiscal
  add column if not exists pac_api_key text;

alter table public.empresa_fiscal
  add column if not exists pac_api_secret text;

comment on column public.empresa_fiscal.pac_provider is 'Proveedor PAC: sandbox, finkok, sw, facturama.';
comment on column public.empresa_fiscal.pac_mode is 'sandbox o production.';

-- Tickets de venta
alter table public.ventas
  add column if not exists ticket_impreso boolean not null default false;

alter table public.ventas
  add column if not exists ticket_impreso_at timestamptz;

-- Facturas: respuesta PAC
alter table public.facturas
  add column if not exists pac_response jsonb;

alter table public.facturas
  add column if not exists timbrado_at timestamptz;
