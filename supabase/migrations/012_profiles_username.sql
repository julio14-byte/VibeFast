-- ============================================================
-- 012 · Username en profiles + RPC disponibilidad
-- ============================================================

alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is 'Usuario de acceso (único, sin email visible).';

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

-- Permite verificar username en registro sin exponer perfiles completos
create or replace function public.is_username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(check_username))
      and trim(check_username) <> ''
  );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- Backfill username desde metadata o email para cuentas existentes
update public.profiles p
set username = coalesce(
  p.username,
  (select raw_user_meta_data ->> 'username' from auth.users u where u.id = p.id),
  split_part(p.email, '@', 1)
)
where p.username is null or p.username = '';

-- Trigger: guardar username al crear usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_username text;
begin
  meta_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, full_name, avatar_url, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    meta_username
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username);

  return new;
end;
$$;
