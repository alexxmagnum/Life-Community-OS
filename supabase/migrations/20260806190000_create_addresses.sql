-- Life Community OS — Address foundation (physical location)
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-006-PHYSICAL-LOCATION-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-005-COMMUNITY-AREA-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
--
-- Creates public.addresses as the physical location layer inside a Territory.
--
-- Security (ADR-003 / ADR-006):
--   - Address is NOT a security boundary.
--   - Isolation path: Address → Territory → Tenant.
--   - No tenant_id column; no RLS in this migration (follow-up).
--
-- Does not create: properties, persons, memberships, users, residents.

-- ---------------------------------------------------------------------------
-- addresses
-- Physical location inside a Territory (optional Community Area)
-- ---------------------------------------------------------------------------

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid not null,
  community_area_id uuid,
  street text not null,
  number text not null,
  unit text,
  postal_code text,
  city text not null,
  latitude numeric,
  longitude numeric,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint addresses_territory_id_fkey
    foreign key (territory_id) references public.territories (id)
    on delete restrict,

  constraint addresses_community_area_id_fkey
    foreign key (community_area_id) references public.community_areas (id)
    on delete restrict,

  constraint addresses_street_not_empty check (
    length(trim(street)) > 0
  ),

  constraint addresses_number_not_empty check (
    length(trim(number)) > 0
  ),

  constraint addresses_city_not_empty check (
    length(trim(city)) > 0
  ),

  constraint addresses_status_allowed check (
    status in (
      'active',
      'inactive',
      'archived'
    )
  ),

  constraint addresses_latitude_range check (
    latitude is null
    or (latitude >= -90 and latitude <= 90)
  ),

  constraint addresses_longitude_range check (
    longitude is null
    or (longitude >= -180 and longitude <= 180)
  )
);

comment on table public.addresses is
  'Physical location inside a Territory (ADR-006). '
  'May optionally belong to a Community Area (organizational only). '
  'Address is NOT a security boundary; isolation path is Address → Territory → Tenant. '
  'Future Property and Person models will reference Address. '
  'RLS is intentionally deferred; future policies must resolve through Territory → Tenant.';

comment on column public.addresses.territory_id is
  'Owning Territory (mandatory). Isolation inherits via territories.tenant_id.';

comment on column public.addresses.community_area_id is
  'Optional Community Area within the same Territory. Null for addresses outside named areas.';

comment on column public.addresses.street is
  'Street name of the physical location.';

comment on column public.addresses.number is
  'Street number (stored as text to allow ranges and non-numeric labels).';

comment on column public.addresses.unit is
  'Optional unit, portal, floor, or secondary locator.';

comment on column public.addresses.postal_code is
  'Optional postal code.';

comment on column public.addresses.city is
  'City / locality name.';

comment on column public.addresses.latitude is
  'Optional WGS84 latitude (-90..90).';

comment on column public.addresses.longitude is
  'Optional WGS84 longitude (-180..180).';

comment on column public.addresses.metadata is
  'Extensible non-relational attributes for physical location details.';

comment on column public.addresses.status is
  'Lifecycle status: active, inactive, or archived.';

create index addresses_territory_id_idx
  on public.addresses (territory_id);

create index addresses_community_area_id_idx
  on public.addresses (community_area_id);

create index addresses_status_idx
  on public.addresses (status);

-- ---------------------------------------------------------------------------
-- Same-territory enforcement for optional Community Area
-- If community_area_id is set, Area.territory_id must equal Address.territory_id.
-- ---------------------------------------------------------------------------

create or replace function public.addresses_enforce_area_same_territory()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_area_territory_id uuid;
begin
  if new.community_area_id is null then
    return new;
  end if;

  select ca.territory_id
    into v_area_territory_id
  from public.community_areas ca
  where ca.id = new.community_area_id;

  if v_area_territory_id is null then
    raise exception
      'community_area_id % does not exist',
      new.community_area_id
      using errcode = '23503';
  end if;

  if v_area_territory_id is distinct from new.territory_id then
    raise exception
      'Address community_area_id must belong to the same Territory as territory_id (ADR-006)'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.addresses_enforce_area_same_territory() is
  'Ensures optional community_area_id belongs to the same Territory as the Address (ADR-006).';

create trigger addresses_enforce_area_same_territory
  before insert or update of territory_id, community_area_id
  on public.addresses
  for each row
  execute function public.addresses_enforce_area_same_territory();
