-- Life Community OS — Territory Core contract (additive)
-- Tenant remains the SaaS isolation root. Territory is the geographic world.
-- NEVER drop tenant_id.

-- ---------------------------------------------------------------------------
-- territories: identity + lifecycle + envelope
-- ---------------------------------------------------------------------------

alter table public.territories
  add column if not exists slug text,
  add column if not exists status text not null default 'active',
  add column if not exists locale text,
  add column if not exists timezone text,
  add column if not exists bounds jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.territories
set slug = 't-' || replace(id::text, '-', '')
where slug is null or btrim(slug) = '';

update public.territories
set slug = 'panoramica-golf'
where id = '10000000-0000-4000-8000-000000000002'::uuid;

update public.territories
set slug = 'life-valley'
where id = '20000000-0000-4000-8000-000000000002'::uuid;

update public.territories
set slug = 'ocean-hills'
where id = '30000000-0000-4000-8000-000000000002'::uuid;

alter table public.territories
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'territories_status_allowed'
  ) then
    alter table public.territories
      add constraint territories_status_allowed
      check (status in ('draft', 'active', 'inactive', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'territories_slug_format'
  ) then
    alter table public.territories
      add constraint territories_slug_format
      check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end $$;

create unique index if not exists territories_tenant_slug_uidx
  on public.territories (tenant_id, slug);

comment on column public.territories.slug is
  'Public Territory slug unique per Tenant. Not a Tenant pack identity.';
comment on column public.territories.status is
  'Territory lifecycle: draft, active, inactive, archived.';
comment on column public.territories.bounds is
  'Optional WGS84 envelope {south,west,north,east}. Not a renderer contract.';
comment on column public.territories.metadata is
  'Extensible Territory metadata. Not AuthZ and not Panorámica-specific.';

-- ---------------------------------------------------------------------------
-- locations: optional Territory ownership (tenant_id stays)
-- ---------------------------------------------------------------------------

alter table public.locations
  add column if not exists territory_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'locations_territory_id_fkey'
  ) then
    alter table public.locations
      add constraint locations_territory_id_fkey
      foreign key (territory_id) references public.territories (id)
      on delete restrict;
  end if;
end $$;

update public.locations as loc
set territory_id = owned.id
from (
  select distinct on (tenant_id) id, tenant_id
  from public.territories
  order by tenant_id, created_at asc
) as owned
where loc.tenant_id = owned.tenant_id
  and loc.territory_id is null;

create index if not exists locations_territory_id_idx
  on public.locations (territory_id);

comment on column public.locations.territory_id is
  'Optional Territory this place belongs to. tenant_id remains the SaaS isolation key.';
