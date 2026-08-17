-- ============================================================
-- 018 · Seguimiento envío cotización por correo
-- ============================================================

alter table public.cotizaciones
  add column if not exists email_enviado_at timestamptz;

alter table public.cotizaciones
  add column if not exists email_destino text;
