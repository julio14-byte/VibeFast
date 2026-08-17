-- ============================================================
-- 019 · API keys MCP (Claude Desktop, larga duración)
-- ============================================================

create table if not exists public.mcp_api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'Claude Desktop',
  key_prefix    text not null,
  key_hash      text not null,
  last_used_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz
);

comment on table public.mcp_api_keys is
  'Claves API de larga duración para MCP (Bearer spos_...).';

create unique index if not exists mcp_api_keys_key_hash_idx
  on public.mcp_api_keys (key_hash);

create index if not exists mcp_api_keys_user_id_idx
  on public.mcp_api_keys (user_id, created_at desc);

alter table public.mcp_api_keys enable row level security;

drop policy if exists "mcp_api_keys_select_own" on public.mcp_api_keys;
create policy "mcp_api_keys_select_own"
  on public.mcp_api_keys for select using (auth.uid() = user_id);

drop policy if exists "mcp_api_keys_insert_own" on public.mcp_api_keys;
create policy "mcp_api_keys_insert_own"
  on public.mcp_api_keys for insert with check (auth.uid() = user_id);

drop policy if exists "mcp_api_keys_update_own" on public.mcp_api_keys;
create policy "mcp_api_keys_update_own"
  on public.mcp_api_keys for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mcp_api_keys_delete_own" on public.mcp_api_keys;
create policy "mcp_api_keys_delete_own"
  on public.mcp_api_keys for delete using (auth.uid() = user_id);
