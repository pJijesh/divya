-- Fixes two Supabase performance-advisor findings:
-- 1) auth_rls_initplan: bare auth.uid() in a policy is re-evaluated per row;
--    wrapping as (select auth.uid()) lets Postgres evaluate it once per query.
-- 2) multiple_permissive_policies: profiles/memberships each had two separate
--    SELECT policies for the same role+action (self-visibility + org-mate
--    visibility), which Postgres must execute and OR together per row instead
--    of once. Consolidated into a single SELECT policy per table.

-- profiles: consolidate "own profile" + "org-mate profile" into one SELECT policy
drop policy "users can select their own profile" on profiles;
drop policy "users can select profiles of their org-mates" on profiles;

create policy "members can select own or org-mate profiles"
  on profiles for select
  using (
    id = (select auth.uid())
    or exists (
      select 1 from memberships mine
      join memberships theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = (select auth.uid())
        and mine.status = 'active'
        and theirs.user_id = profiles.id
        and theirs.status = 'active'
    )
  );

drop policy "users can insert their own profile" on profiles;
create policy "users can insert their own profile"
  on profiles for insert
  with check (id = (select auth.uid()));

drop policy "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update
  using (id = (select auth.uid()));

-- memberships: consolidate "own membership" + "org members can select" into one
drop policy "users can select their own memberships" on memberships;
drop policy "org members can select memberships in their org" on memberships;

create policy "members can select own or org memberships"
  on memberships for select
  using (
    user_id = (select auth.uid())
    or private.is_org_member(organization_id, 'viewer')
  );
