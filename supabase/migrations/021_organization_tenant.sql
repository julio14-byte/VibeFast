-- ============================================================
-- 021 · Fase 2 SaaS · Multi-tenant por organization_id
-- ------------------------------------------------------------
-- Datos de negocio aislados por organización (ferretería).
-- user_id se conserva como auditoría (quién creó el registro).
-- ============================================================

-- ------------------------------------------------------------
-- Helpers RLS
-- ------------------------------------------------------------
create or replace function public.user_belongs_to_organization(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.user_org_role(org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where organization_id = org_id
    and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.user_can_manage_org(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- ------------------------------------------------------------
-- organization_id en tablas de negocio
-- ------------------------------------------------------------
alter table public.productos
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.proveedores
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.empresa_fiscal
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.clientes
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.ventas
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.facturas
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.cotizaciones
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

-- Backfill desde organization_members (owner del user_id)
update public.productos p
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = p.user_id
  and p.organization_id is null;

update public.proveedores t
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = t.user_id
  and t.organization_id is null;

update public.empresa_fiscal t
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = t.user_id
  and t.organization_id is null;

update public.clientes t
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = t.user_id
  and t.organization_id is null;

update public.ventas t
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = t.user_id
  and t.organization_id is null;

update public.facturas t
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = t.user_id
  and t.organization_id is null;

update public.cotizaciones t
set organization_id = m.organization_id
from public.organization_members m
where m.user_id = t.user_id
  and t.organization_id is null;

-- NOT NULL (solo filas con membership; huérfanas quedan excluidas de RLS)
alter table public.productos alter column organization_id set not null;
alter table public.proveedores alter column organization_id set not null;
alter table public.clientes alter column organization_id set not null;
alter table public.ventas alter column organization_id set not null;
alter table public.facturas alter column organization_id set not null;
alter table public.cotizaciones alter column organization_id set not null;

-- empresa_fiscal puede no existir por org aún
delete from public.empresa_fiscal where organization_id is null;
alter table public.empresa_fiscal alter column organization_id set not null;

-- Índices y unicidad por organización
drop index if exists public.productos_user_codigo_idx;
create unique index if not exists productos_org_codigo_idx
  on public.productos (organization_id, codigo);

create index if not exists productos_organization_id_idx
  on public.productos (organization_id, created_at desc);

drop index if exists public.productos_nombre_idx;
create index if not exists productos_org_nombre_idx
  on public.productos (organization_id, nombre);

drop index if exists public.ventas_user_folio_idx;
create unique index if not exists ventas_org_folio_idx
  on public.ventas (organization_id, folio);

drop index if exists public.ventas_user_id_idx;
create index if not exists ventas_organization_id_idx
  on public.ventas (organization_id, created_at desc);

drop index if exists public.facturas_user_serie_folio_idx;
create unique index if not exists facturas_org_serie_folio_idx
  on public.facturas (organization_id, serie, folio);

drop index if exists public.facturas_user_id_idx;
create index if not exists facturas_organization_id_idx
  on public.facturas (organization_id, created_at desc);

drop index if exists public.cotizaciones_user_folio_idx;
create unique index if not exists cotizaciones_org_folio_idx
  on public.cotizaciones (organization_id, folio);

drop index if exists public.cotizaciones_user_estado_idx;
create index if not exists cotizaciones_org_estado_idx
  on public.cotizaciones (organization_id, estado, created_at desc);

drop index if exists public.clientes_user_publico_general_idx;
create unique index if not exists clientes_org_publico_general_idx
  on public.clientes (organization_id)
  where es_publico_general = true;

create index if not exists clientes_organization_id_idx
  on public.clientes (organization_id, nombre);

create index if not exists proveedores_organization_id_idx
  on public.proveedores (organization_id, nombre);

alter table public.empresa_fiscal drop constraint if exists empresa_fiscal_user_id_key;
create unique index if not exists empresa_fiscal_organization_id_key
  on public.empresa_fiscal (organization_id);

-- ------------------------------------------------------------
-- RLS · productos
-- ------------------------------------------------------------
drop policy if exists "productos_select_own" on public.productos;
create policy "productos_select_org"
  on public.productos for select
  using (public.user_belongs_to_organization(organization_id));

drop policy if exists "productos_insert_own" on public.productos;
create policy "productos_insert_org"
  on public.productos for insert
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "productos_update_own" on public.productos;
create policy "productos_update_org"
  on public.productos for update
  using (public.user_belongs_to_organization(organization_id))
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "productos_delete_own" on public.productos;
create policy "productos_delete_org"
  on public.productos for delete
  using (public.user_belongs_to_organization(organization_id));

-- proveedores
drop policy if exists "proveedores_select_own" on public.proveedores;
create policy "proveedores_select_org"
  on public.proveedores for select
  using (public.user_belongs_to_organization(organization_id));

drop policy if exists "proveedores_insert_own" on public.proveedores;
create policy "proveedores_insert_org"
  on public.proveedores for insert
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "proveedores_update_own" on public.proveedores;
create policy "proveedores_update_org"
  on public.proveedores for update
  using (public.user_belongs_to_organization(organization_id))
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "proveedores_delete_own" on public.proveedores;
create policy "proveedores_delete_org"
  on public.proveedores for delete
  using (public.user_belongs_to_organization(organization_id));

-- empresa_fiscal
drop policy if exists "empresa_fiscal_select_own" on public.empresa_fiscal;
create policy "empresa_fiscal_select_org"
  on public.empresa_fiscal for select
  using (public.user_belongs_to_organization(organization_id));

drop policy if exists "empresa_fiscal_insert_own" on public.empresa_fiscal;
create policy "empresa_fiscal_insert_org"
  on public.empresa_fiscal for insert
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "empresa_fiscal_update_own" on public.empresa_fiscal;
create policy "empresa_fiscal_update_org"
  on public.empresa_fiscal for update
  using (public.user_belongs_to_organization(organization_id))
  with check (public.user_belongs_to_organization(organization_id));

-- clientes
drop policy if exists "clientes_select_own" on public.clientes;
create policy "clientes_select_org"
  on public.clientes for select
  using (public.user_belongs_to_organization(organization_id));

drop policy if exists "clientes_insert_own" on public.clientes;
create policy "clientes_insert_org"
  on public.clientes for insert
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "clientes_update_own" on public.clientes;
create policy "clientes_update_org"
  on public.clientes for update
  using (public.user_belongs_to_organization(organization_id))
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "clientes_delete_own" on public.clientes;
create policy "clientes_delete_org"
  on public.clientes for delete
  using (public.user_belongs_to_organization(organization_id));

-- ventas
drop policy if exists "ventas_select_own" on public.ventas;
create policy "ventas_select_org"
  on public.ventas for select
  using (public.user_belongs_to_organization(organization_id));

drop policy if exists "ventas_insert_own" on public.ventas;
create policy "ventas_insert_org"
  on public.ventas for insert
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "ventas_update_own" on public.ventas;
create policy "ventas_update_org"
  on public.ventas for update
  using (public.user_belongs_to_organization(organization_id))
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "ventas_delete_own" on public.ventas;
create policy "ventas_delete_org"
  on public.ventas for delete
  using (public.user_belongs_to_organization(organization_id));

-- venta_items (vía venta.organization_id)
drop policy if exists "venta_items_select_own" on public.venta_items;
create policy "venta_items_select_org"
  on public.venta_items for select
  using (
    exists (
      select 1 from public.ventas v
      where v.id = venta_id
        and public.user_belongs_to_organization(v.organization_id)
    )
  );

drop policy if exists "venta_items_insert_own" on public.venta_items;
create policy "venta_items_insert_org"
  on public.venta_items for insert
  with check (
    exists (
      select 1 from public.ventas v
      where v.id = venta_id
        and public.user_belongs_to_organization(v.organization_id)
    )
  );

-- facturas
drop policy if exists "facturas_select_own" on public.facturas;
create policy "facturas_select_org"
  on public.facturas for select
  using (public.user_belongs_to_organization(organization_id));

drop policy if exists "facturas_insert_own" on public.facturas;
create policy "facturas_insert_org"
  on public.facturas for insert
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "facturas_update_own" on public.facturas;
create policy "facturas_update_org"
  on public.facturas for update
  using (public.user_belongs_to_organization(organization_id))
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "facturas_delete_own" on public.facturas;
create policy "facturas_delete_org"
  on public.facturas for delete
  using (public.user_belongs_to_organization(organization_id));

-- cotizaciones
drop policy if exists "cotizaciones_select_own" on public.cotizaciones;
create policy "cotizaciones_select_org"
  on public.cotizaciones for select
  using (public.user_belongs_to_organization(organization_id));

drop policy if exists "cotizaciones_insert_own" on public.cotizaciones;
create policy "cotizaciones_insert_org"
  on public.cotizaciones for insert
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "cotizaciones_update_own" on public.cotizaciones;
create policy "cotizaciones_update_org"
  on public.cotizaciones for update
  using (public.user_belongs_to_organization(organization_id))
  with check (public.user_belongs_to_organization(organization_id));

drop policy if exists "cotizaciones_delete_own" on public.cotizaciones;
create policy "cotizaciones_delete_org"
  on public.cotizaciones for delete
  using (public.user_belongs_to_organization(organization_id));

-- cotizacion_items
drop policy if exists "cotizacion_items_select_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_select_org"
  on public.cotizacion_items for select
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id
        and public.user_belongs_to_organization(c.organization_id)
    )
  );

drop policy if exists "cotizacion_items_insert_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_insert_org"
  on public.cotizacion_items for insert
  with check (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id
        and public.user_belongs_to_organization(c.organization_id)
    )
  );

drop policy if exists "cotizacion_items_update_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_update_org"
  on public.cotizacion_items for update
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id
        and public.user_belongs_to_organization(c.organization_id)
    )
  );

drop policy if exists "cotizacion_items_delete_via_cotizacion" on public.cotizacion_items;
create policy "cotizacion_items_delete_org"
  on public.cotizacion_items for delete
  using (
    exists (
      select 1 from public.cotizaciones c
      where c.id = cotizacion_id
        and public.user_belongs_to_organization(c.organization_id)
    )
  );

-- ------------------------------------------------------------
-- organization_members · ver equipo + gestión owner/admin
-- ------------------------------------------------------------
drop policy if exists "organization_members_select_own" on public.organization_members;
create policy "organization_members_select_org"
  on public.organization_members for select
  using (
    user_id = auth.uid()
    or public.user_belongs_to_organization(organization_id)
  );

drop policy if exists "organization_members_insert_manage" on public.organization_members;
create policy "organization_members_insert_manage"
  on public.organization_members for insert
  with check (public.user_can_manage_org(organization_id));

drop policy if exists "organization_members_delete_manage" on public.organization_members;
create policy "organization_members_delete_manage"
  on public.organization_members for delete
  using (
    public.user_can_manage_org(organization_id)
    and user_id <> auth.uid()
  );

drop policy if exists "organization_members_update_manage" on public.organization_members;
create policy "organization_members_update_manage"
  on public.organization_members for update
  using (public.user_can_manage_org(organization_id))
  with check (public.user_can_manage_org(organization_id));

-- ------------------------------------------------------------
-- organization_invites · invitar empleados por email
-- ------------------------------------------------------------
create table if not exists public.organization_invites (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  email             text not null,
  role              text not null default 'cajero'
    check (role in ('admin', 'cajero')),
  invited_by        uuid not null references auth.users (id) on delete cascade,
  created_at        timestamptz not null default now(),
  accepted_at       timestamptz,
  unique (organization_id, email)
);

create index if not exists organization_invites_email_idx
  on public.organization_invites (lower(email));

alter table public.organization_invites enable row level security;

drop policy if exists "organization_invites_select_manage" on public.organization_invites;
create policy "organization_invites_select_manage"
  on public.organization_invites for select
  using (public.user_can_manage_org(organization_id));

drop policy if exists "organization_invites_insert_manage" on public.organization_invites;
create policy "organization_invites_insert_manage"
  on public.organization_invites for insert
  with check (public.user_can_manage_org(organization_id));

drop policy if exists "organization_invites_delete_manage" on public.organization_invites;
create policy "organization_invites_delete_manage"
  on public.organization_invites for delete
  using (public.user_can_manage_org(organization_id));

-- profiles · ver compañeros de la misma ferretería (equipo)
drop policy if exists "profiles_select_org_teammates" on public.profiles;
create policy "profiles_select_org_teammates"
  on public.profiles for select
  using (
    id in (
      select om.user_id
      from public.organization_members om
      where om.organization_id in (
        select organization_id
        from public.organization_members
        where user_id = auth.uid()
      )
    )
  );

-- ------------------------------------------------------------
-- handle_new_user · unirse por invitación o crear org nueva
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  org_id uuid;
  display_name text;
  invite record;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1),
    'Mi ferretería'
  );

  insert into public.profiles (id, email, full_name, avatar_url, plan)
  values (
    new.id,
    new.email,
    display_name,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'starter'
  )
  on conflict (id) do nothing;

  select *
  into invite
  from public.organization_invites
  where lower(email) = lower(new.email)
    and accepted_at is null
  order by created_at desc
  limit 1;

  if invite.id is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (invite.organization_id, new.id, invite.role);

    update public.organization_invites
    set accepted_at = now()
    where id = invite.id;

    return new;
  end if;

  insert into public.organizations (
    name, plan_id, subscription_status, trial_ends_at, product_limit, user_limit
  )
  values (display_name, 'starter', 'trialing', now() + interval '14 days', 200, 1)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  return new;
end;
$$;
