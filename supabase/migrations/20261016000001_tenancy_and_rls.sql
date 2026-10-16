-- Divya Phase 1: tenancy foundation (organizations, memberships, profiles) + RLS.
-- Every later tenant-scoped table follows the same organization_id + RLS pattern
-- established here. See docs/ARCHITECTURE (plan file) for the full schema rationale.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- updated_at trigger helper, reused by every table below and by future ones
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles (display data for auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- memberships (role-per-membership RBAC: admin / editor / viewer)
-- ---------------------------------------------------------------------------
create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  invited_email text,
  status text not null default 'active' check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index memberships_user_org_role_idx on memberships (user_id, organization_id, role);
create index memberships_organization_id_idx on memberships (organization_id);

create trigger memberships_set_updated_at
  before update on memberships
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- is_org_member(): stable, security-definer helper used by every RLS policy
-- on every tenant table. Marked stable so Postgres can cache it per statement.
-- Role check is additive: 'viewer' is satisfied by any active membership;
-- 'editor'/'admin' require that role or higher.
-- ---------------------------------------------------------------------------
create or replace function is_org_member(org_id uuid, min_role text default 'viewer')
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from memberships m
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;

-- organizations: visible to members; only an existing admin can update org settings.
-- Insert is intentionally NOT allowed via RLS for regular users — organization
-- creation happens through a service-role Route Handler (see lib/supabase/admin.ts)
-- so it can atomically create the org + first admin membership together.
create policy "org members can select their organization"
  on organizations for select
  using (is_org_member(id, 'viewer'));

create policy "org admins can update their organization"
  on organizations for update
  using (is_org_member(id, 'admin'));

-- profiles: a user can always see and edit their own profile.
-- Org-mates' profiles (for display in Members list) are also readable.
create policy "users can select their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "users can select profiles of their org-mates"
  on profiles for select
  using (
    exists (
      select 1 from memberships mine
      join memberships theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and mine.status = 'active'
        and theirs.user_id = profiles.id
        and theirs.status = 'active'
    )
  );

create policy "users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- memberships: non-recursive self-visibility (required so is_org_member's own
-- subquery and the UI can always resolve "what are my memberships") plus
-- visibility of org-mates for the Members settings page.
create policy "users can select their own memberships"
  on memberships for select
  using (user_id = auth.uid());

create policy "org members can select memberships in their org"
  on memberships for select
  using (is_org_member(organization_id, 'viewer'));

create policy "org admins can insert memberships"
  on memberships for insert
  with check (is_org_member(organization_id, 'admin'));

create policy "org admins can update memberships"
  on memberships for update
  using (is_org_member(organization_id, 'admin'));

create policy "org admins can delete memberships"
  on memberships for delete
  using (is_org_member(organization_id, 'admin'));
