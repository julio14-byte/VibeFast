-- ============================================================
-- 022 · Datos del negocio + personalización de ticket
-- ------------------------------------------------------------
-- Extiende empresa_fiscal con contacto y opciones de ticket.
-- Una fila por organización (ferretería).
-- ============================================================

alter table public.empresa_fiscal
  add column if not exists nombre_comercial text;

alter table public.empresa_fiscal
  add column if not exists telefono text;

alter table public.empresa_fiscal
  add column if not exists email text;

alter table public.empresa_fiscal
  add column if not exists ticket_mensaje_pie text not null default '¡Gracias por su compra!';

alter table public.empresa_fiscal
  add column if not exists ticket_texto_extra text;

alter table public.empresa_fiscal
  add column if not exists ticket_mostrar_rfc boolean not null default true;

alter table public.empresa_fiscal
  add column if not exists ticket_mostrar_direccion boolean not null default true;

alter table public.empresa_fiscal
  add column if not exists ticket_mostrar_telefono boolean not null default true;

alter table public.empresa_fiscal
  add column if not exists ticket_mostrar_cliente boolean not null default true;

alter table public.empresa_fiscal
  add column if not exists ticket_mostrar_iva boolean not null default true;

alter table public.empresa_fiscal
  add column if not exists ticket_mostrar_forma_pago boolean not null default true;

comment on column public.empresa_fiscal.nombre_comercial is
  'Nombre en ticket y mostrador; si vacío se usa razón social.';

comment on column public.empresa_fiscal.ticket_mensaje_pie is
  'Texto al final del ticket de venta (80mm).';

comment on column public.empresa_fiscal.ticket_texto_extra is
  'Línea opcional bajo el encabezado (horario, promoción, etc.).';
