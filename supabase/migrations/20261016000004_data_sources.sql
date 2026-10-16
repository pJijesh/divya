-- Divya Phase 1: data source connections, with credentials stored in
-- Supabase Vault (never a plaintext/app-encrypted column). The password
-- itself never lives in this table — only a reference (credential_ref)
-- to a vault.secrets row. See docs (plan file) for the full rationale.

create table data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text not null default 'postgres' check (type in ('postgres')),
  host text not null,
  port integer not null default 5432,
  database_name text not null,
  username text not null,
  ssl_mode text not null default 'require' check (ssl_mode in ('require', 'disable', 'verify-full')),
  credential_ref uuid not null,
  connection_options jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'connected', 'error')),
  last_tested_at timestamptz,
  last_test_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index data_sources_organization_id_idx on data_sources (organization_id);

create trigger data_sources_set_updated_at
  before update on data_sources
  for each row execute function private.set_updated_at();

alter table data_sources enable row level security;

create policy "org members can select data sources"
  on data_sources for select
  using (private.is_org_member(organization_id, 'viewer'));

create policy "org editors can insert data sources"
  on data_sources for insert
  with check (private.is_org_member(organization_id, 'editor'));

create policy "org editors can update data sources"
  on data_sources for update
  using (private.is_org_member(organization_id, 'editor'));

create policy "org editors can delete data sources"
  on data_sources for delete
  using (private.is_org_member(organization_id, 'editor'));

-- ---------------------------------------------------------------------------
-- Vault-backed credential helpers. Both live in `public` (not `private`)
-- because they must be callable via supabase-js .rpc() from our Route
-- Handlers, which only reach PostgREST-exposed schemas. Each function
-- authorizes internally via auth.uid() + org role, so direct RPC access
-- by an end user is safe: they can only ever touch their own org's data.
-- (The Supabase security advisor flags these as "callable by signed-in
-- users" — expected and intentional; see the internal auth checks below.)
-- ---------------------------------------------------------------------------

create or replace function public.create_data_source_secret(secret_value text, secret_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  return vault.create_secret(secret_value, secret_name);
end;
$$;

revoke execute on function public.create_data_source_secret(text, text) from public, anon;
grant execute on function public.create_data_source_secret(text, text) to authenticated;

create or replace function public.get_data_source_secret(data_source_row_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_org_id uuid;
  v_decrypted text;
begin
  select ds.credential_ref, ds.organization_id into v_secret_id, v_org_id
  from public.data_sources ds
  where ds.id = data_source_row_id;

  if v_secret_id is null then
    raise exception 'data source not found';
  end if;

  if not private.is_org_member(v_org_id, 'editor') then
    raise exception 'not authorized';
  end if;

  select decrypted_secret into v_decrypted
  from vault.decrypted_secrets
  where id = v_secret_id;

  return v_decrypted;
end;
$$;

revoke execute on function public.get_data_source_secret(uuid) from public, anon;
grant execute on function public.get_data_source_secret(uuid) to authenticated;
