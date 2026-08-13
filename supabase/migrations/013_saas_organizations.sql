-- ============================================================
-- 013 · SaaS · organizations + suscripción (Fase 1)
-- ------------------------------------------------------------
-- Tenant = organization. Un owner por negocio (Fase 1).
-- El cobro y estado de suscripción viven en organizations.
-- ============================================================

-- ------------------------------------------------------------
-- organizations
-- ------------------------------------------------------------
create table if not exists public.organizations (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null default 'Mi ferretería',
  slug                    text unique,
  plan_id                 text not null default 'starter',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text not null default 'trialing'
    check (
      subscription_status in (
        'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid'
      )
    ),
  trial_ends_at           timestamptz not null default (now() + interval '14 days'),
  product_limit           integer not null default 200 check (product_limit >= 0),
  user_limit              integer not null default 1 check (user_limit >= 1),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.organizations is 'Negocio / tenant SaaS (ferretería cliente de SmartPOS).';

create index if not exists organizations_stripe_customer_idx
  on public.organizations (stripe_customer_id);

create index if not exists organizations_stripe_subscription_idx
  on public.organizations (stripe_subscription_id);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- organization_members
-- ------------------------------------------------------------
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null default 'owner'
    check (role in ('owner', 'admin', 'cajero')),
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

comment on table public.organization_members is 'Usuarios vinculados a un negocio SaaS.';

-- ------------------------------------------------------------
-- handle_new_user · crea profile + organization (Fase 1)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  org_id uuid;
  display_name text;
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

  insert into public.organizations (name, plan_id, subscription_status, trial_ends_at, product_limit, user_limit)
  values (display_name, 'starter', 'trialing', now() + interval '14 days', 200, 1)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  return new;
end;
$$;

-- ------------------------------------------------------------
-- Backfill · usuarios existentes sin organization
-- ------------------------------------------------------------
do $$
declare
  r record;
  org_id uuid;
begin
  for r in
    select p.id, p.full_name, p.email
    from public.profiles p
    where not exists (
      select 1 from public.organization_members m where m.user_id = p.id
    )
  loop
    insert into public.organizations (
      name, plan_id, subscription_status, trial_ends_at, product_limit, user_limit
    )
    values (
      coalesce(r.full_name, split_part(r.email, '@', 1), 'Mi ferretería'),
      'starter',
      'trialing',
      now() + interval '14 days',
      200,
      1
    )
    returning id into org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (org_id, r.id, 'owner');
  end loop;
end $$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "organizations_update_owner" on public.organizations;
create policy "organizations_update_owner"
  on public.organizations for update
  using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  )
  with check (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

drop policy if exists "organization_members_select_own" on public.organization_members;
create policy "organization_members_select_own"
  on public.organization_members for select
  using (user_id = auth.uid());
