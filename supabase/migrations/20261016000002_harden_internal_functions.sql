-- Fixes two Supabase security-advisor findings on the previous migration:
-- 1) mutable search_path on set_updated_at (search-path-hijack risk)
-- 2) is_org_member callable directly via PostgREST RPC by anon/authenticated,
--    because it lived in the `public` schema (which is API-exposed).
-- Fix: move both helpers into a `private` schema, which is never listed in
-- the API-exposed schemas (supabase/config.toml [api] schemas = public, graphql_public),
-- so they stop being reachable via /rest/v1/rpc/* while remaining callable
-- from RLS policies via a schema-qualified reference.

create schema if not exists private;

-- recreate set_updated_at in private, with a pinned empty search_path
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger organizations_set_updated_at on organizations;
drop trigger profiles_set_updated_at on profiles;
drop trigger memberships_set_updated_at on memberships;

create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function private.set_updated_at();

create trigger memberships_set_updated_at
  before update on memberships
  for each row execute function private.set_updated_at();

drop function if exists public.set_updated_at();

-- recreate is_org_member in private, fully schema-qualified body (search_path pinned empty)
create or replace function private.is_org_member(org_id uuid, min_role text default 'viewer')
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and (
        min_role = 'viewer'
        or (min_role = 'editor' and m.role in ('editor', 'admin'))
        or (min_role = 'admin' and m.role = 'admin')
      )
  );
$$;

grant usage on schema private to authenticated, anon;
grant execute on function private.is_org_member(uuid, text) to authenticated, anon;

-- repoint every policy at the private, schema-qualified function
drop policy "org members can select their organization" on organizations;
drop policy "org admins can update their organization" on organizations;
create policy "org members can select their organization"
  on organizations for select
  using (private.is_org_member(id, 'viewer'));
create policy "org admins can update their organization"
  on organizations for update
  using (private.is_org_member(id, 'admin'));

drop policy "org members can select memberships in their org" on memberships;
drop policy "org admins can insert memberships" on memberships;
drop policy "org admins can update memberships" on memberships;
drop policy "org admins can delete memberships" on memberships;
create policy "org members can select memberships in their org"
  on memberships for select
  using (private.is_org_member(organization_id, 'viewer'));
create policy "org admins can insert memberships"
  on memberships for insert
  with check (private.is_org_member(organization_id, 'admin'));
create policy "org admins can update memberships"
  on memberships for update
  using (private.is_org_member(organization_id, 'admin'));
create policy "org admins can delete memberships"
  on memberships for delete
  using (private.is_org_member(organization_id, 'admin'));

drop function if exists public.is_org_member(uuid, text);
