-- Divya Phase 1: semantic layer v1 (datasets, dataset_fields, metrics,
-- dimensions). organization_id is denormalized onto every table here
-- (not just joined through datasets) so every RLS policy stays a single
-- -column check, matching the pattern established for
-- organizations/memberships/data_sources.

create table datasets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  data_source_id uuid not null references data_sources(id) on delete cascade,
  name text not null,
  description text,
  source_type text not null check (source_type in ('table', 'query')),
  source_table_schema text,
  source_table_name text,
  source_sql text,
  columns_cache jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint datasets_source_shape check (
    (source_type = 'table' and source_table_name is not null and source_sql is null)
    or (source_type = 'query' and source_sql is not null and source_table_name is null)
  )
);

create index datasets_organization_id_idx on datasets (organization_id);
create index datasets_data_source_id_idx on datasets (data_source_id);

create trigger datasets_set_updated_at
  before update on datasets
  for each row execute function private.set_updated_at();

create table dataset_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  dataset_id uuid not null references datasets(id) on delete cascade,
  source_column text not null,
  data_type text not null check (data_type in ('string', 'number', 'date', 'boolean', 'json')),
  created_at timestamptz not null default now(),
  unique (dataset_id, source_column)
);

create index dataset_fields_organization_id_idx on dataset_fields (organization_id);
create index dataset_fields_dataset_id_idx on dataset_fields (dataset_id);

create table metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  dataset_id uuid not null references datasets(id) on delete cascade,
  name text not null,
  label text not null,
  description text,
  aggregation text not null check (aggregation in ('sum', 'avg', 'count', 'count_distinct', 'min', 'max')),
  expression jsonb not null,
  format text not null default 'number' check (format in ('number', 'currency', 'percent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dataset_id, name)
);

create index metrics_organization_id_idx on metrics (organization_id);
create index metrics_dataset_id_idx on metrics (dataset_id);

create trigger metrics_set_updated_at
  before update on metrics
  for each row execute function private.set_updated_at();

create table dimensions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  dataset_id uuid not null references datasets(id) on delete cascade,
  name text not null,
  label text not null,
  field_id uuid not null references dataset_fields(id) on delete cascade,
  type text not null check (type in ('categorical', 'time')),
  time_grain text check (time_grain in ('day', 'week', 'month', 'quarter', 'year')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dataset_id, name),
  constraint dimensions_time_grain_shape check (
    (type = 'time' and time_grain is not null) or (type = 'categorical' and time_grain is null)
  )
);

create index dimensions_organization_id_idx on dimensions (organization_id);
create index dimensions_dataset_id_idx on dimensions (dataset_id);

create trigger dimensions_set_updated_at
  before update on dimensions
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — identical single-column pattern across all four tables.
-- ---------------------------------------------------------------------------
alter table datasets enable row level security;
alter table dataset_fields enable row level security;
alter table metrics enable row level security;
alter table dimensions enable row level security;

create policy "org members can select datasets" on datasets for select
  using (private.is_org_member(organization_id, 'viewer'));
create policy "org editors can insert datasets" on datasets for insert
  with check (private.is_org_member(organization_id, 'editor'));
create policy "org editors can update datasets" on datasets for update
  using (private.is_org_member(organization_id, 'editor'));
create policy "org editors can delete datasets" on datasets for delete
  using (private.is_org_member(organization_id, 'editor'));

create policy "org members can select dataset fields" on dataset_fields for select
  using (private.is_org_member(organization_id, 'viewer'));
create policy "org editors can insert dataset fields" on dataset_fields for insert
  with check (private.is_org_member(organization_id, 'editor'));
create policy "org editors can update dataset fields" on dataset_fields for update
  using (private.is_org_member(organization_id, 'editor'));
create policy "org editors can delete dataset fields" on dataset_fields for delete
  using (private.is_org_member(organization_id, 'editor'));

create policy "org members can select metrics" on metrics for select
  using (private.is_org_member(organization_id, 'viewer'));
create policy "org editors can insert metrics" on metrics for insert
  with check (private.is_org_member(organization_id, 'editor'));
create policy "org editors can update metrics" on metrics for update
  using (private.is_org_member(organization_id, 'editor'));
create policy "org editors can delete metrics" on metrics for delete
  using (private.is_org_member(organization_id, 'editor'));

create policy "org members can select dimensions" on dimensions for select
  using (private.is_org_member(organization_id, 'viewer'));
create policy "org editors can insert dimensions" on dimensions for insert
  with check (private.is_org_member(organization_id, 'editor'));
create policy "org editors can update dimensions" on dimensions for update
  using (private.is_org_member(organization_id, 'editor'));
create policy "org editors can delete dimensions" on dimensions for delete
  using (private.is_org_member(organization_id, 'editor'));
