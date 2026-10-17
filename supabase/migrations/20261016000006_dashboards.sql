-- Divya Phase 1: dashboards, dashboard_widgets, dashboard_filters.
-- organization_id denormalized onto every table, same pattern as the
-- semantic layer migration, for single-column RLS everywhere.

create table dashboards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  is_published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index dashboards_organization_id_idx on dashboards (organization_id);

create trigger dashboards_set_updated_at
  before update on dashboards
  for each row execute function private.set_updated_at();

create table dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  dataset_id uuid not null references datasets(id) on delete cascade,
  widget_type text not null check (
    widget_type in ('bar', 'line', 'area', 'pie', 'scatter', 'kpi', 'table', 'pivot_table')
  ),
  title text,
  query_config jsonb not null default '{}'::jsonb,
  visual_config jsonb not null default '{}'::jsonb,
  layout jsonb not null default '{"x":0,"y":0,"w":6,"h":4}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dashboard_widgets_organization_id_idx on dashboard_widgets (organization_id);
create index dashboard_widgets_dashboard_id_idx on dashboard_widgets (dashboard_id);

create trigger dashboard_widgets_set_updated_at
  before update on dashboard_widgets
  for each row execute function private.set_updated_at();

create table dashboard_filters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  name text not null,
  field_id uuid not null references dataset_fields(id) on delete cascade,
  filter_type text not null check (filter_type in ('select', 'multiselect', 'date_range', 'text')),
  default_value jsonb,
  applies_to_widget_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dashboard_filters_organization_id_idx on dashboard_filters (organization_id);
create index dashboard_filters_dashboard_id_idx on dashboard_filters (dashboard_id);

create trigger dashboard_filters_set_updated_at
  before update on dashboard_filters
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — same single-column pattern as every other tenant table.
-- An extra wrinkle: viewers may SELECT a dashboard/its widgets/filters
-- only when it's published OR they're an editor+ (drafts are invisible to
-- viewer-role users, per docs/UX.md §3.4 "viewer role literally cannot
-- see unpublished dashboards" — a hard permission boundary, not a UI one).
-- ---------------------------------------------------------------------------
alter table dashboards enable row level security;
alter table dashboard_widgets enable row level security;
alter table dashboard_filters enable row level security;

create policy "members can select visible dashboards" on dashboards for select
  using (
    (is_published and private.is_org_member(organization_id, 'viewer'))
    or private.is_org_member(organization_id, 'editor')
  );
create policy "org editors can insert dashboards" on dashboards for insert
  with check (private.is_org_member(organization_id, 'editor'));
create policy "org editors can update dashboards" on dashboards for update
  using (private.is_org_member(organization_id, 'editor'));
create policy "org editors can delete dashboards" on dashboards for delete
  using (private.is_org_member(organization_id, 'editor'));

create policy "members can select widgets of visible dashboards" on dashboard_widgets for select
  using (
    exists (
      select 1 from dashboards d
      where d.id = dashboard_widgets.dashboard_id
        and (
          (d.is_published and private.is_org_member(dashboard_widgets.organization_id, 'viewer'))
          or private.is_org_member(dashboard_widgets.organization_id, 'editor')
        )
    )
  );
create policy "org editors can insert widgets" on dashboard_widgets for insert
  with check (private.is_org_member(organization_id, 'editor'));
create policy "org editors can update widgets" on dashboard_widgets for update
  using (private.is_org_member(organization_id, 'editor'));
create policy "org editors can delete widgets" on dashboard_widgets for delete
  using (private.is_org_member(organization_id, 'editor'));

create policy "members can select filters of visible dashboards" on dashboard_filters for select
  using (
    exists (
      select 1 from dashboards d
      where d.id = dashboard_filters.dashboard_id
        and (
          (d.is_published and private.is_org_member(dashboard_filters.organization_id, 'viewer'))
          or private.is_org_member(dashboard_filters.organization_id, 'editor')
        )
    )
  );
create policy "org editors can insert filters" on dashboard_filters for insert
  with check (private.is_org_member(organization_id, 'editor'));
create policy "org editors can update filters" on dashboard_filters for update
  using (private.is_org_member(organization_id, 'editor'));
create policy "org editors can delete filters" on dashboard_filters for delete
  using (private.is_org_member(organization_id, 'editor'));
