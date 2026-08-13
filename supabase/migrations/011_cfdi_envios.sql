-- ============================================================
-- 011 · Seguimiento envío CFDI
-- ============================================================

alter table public.facturas
  add column if not exists email_enviado_at timestamptz;

alter table public.facturas
  add column if not exists whatsapp_enviado_at timestamptz;

alter table public.facturas
  add column if not exists ultimo_envio_destino text;
