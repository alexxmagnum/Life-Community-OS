-- Life Community OS — Locations (map SoT)
-- Location is the single product place entity for Life Map + discovery.
-- Distinct from addresses (postal) and official_entity_profiles.

create table if not exists public.locations (
  id text primary key,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  type text not null,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  category text not null,
  visibility text not null default 'public',
  geocode_provider text,
  geocode_source_ref text,
  geocode_display_name text,
  contact text,
  summary text,
  image_url text,
  hours text,
  area_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint locations_type_allowed check (
    type in ('business', 'service', 'facility', 'event', 'community-place')
  ),
  constraint locations_visibility_allowed check (
    visibility in ('public', 'members', 'private')
  ),
  constraint locations_latitude_range check (latitude between -90 and 90),
  constraint locations_longitude_range check (longitude between -180 and 180)
);

comment on table public.locations is
  'Map-facing place SoT. LifeMapObject and LocalEntity discovery project from Location.';

create index if not exists locations_tenant_id_idx on public.locations (tenant_id);
create index if not exists locations_tenant_category_idx
  on public.locations (tenant_id, category);
create index if not exists locations_tenant_visibility_idx
  on public.locations (tenant_id, visibility);

alter table public.locations enable row level security;

create policy locations_tenant_select on public.locations
  for select
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

create policy locations_tenant_insert on public.locations
  for insert
  with check (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

create policy locations_tenant_update on public.locations
  for update
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  )
  with check (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

create policy locations_tenant_delete on public.locations
  for delete
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

grant select, insert, update, delete on public.locations to authenticated;
