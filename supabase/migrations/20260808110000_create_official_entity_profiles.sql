-- Life Community OS — Wave B: Official Entity Profiles
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-016-OFFICIAL-ENTITIES-BUSINESS-PROFILES-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-042-WAVE-B-TERRITORY-AUTHORITY-PERSISTENCE-DESIGN.md
-- Design: docs/013_DATA_MODEL/12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md
-- Review: docs/013_DATA_MODEL/13_WAVE_B_MIGRATION_SQL_REVIEW.md
-- Depends on:
--   20260806121000_foundation_identity_model.sql
--   20260806160000_create_community_areas.sql
--
-- Scope (approved decisions):
--   - official_entity_profiles only
--   - NO business_profiles (deferred)
--   - kinds: territory_authority | municipality | public_service | other_official
--   - Territory Authority = kind territory_authority (not a separate table)
--
-- Out of scope:
--   Channels, Groups, Resources, Experiences, LocalEntity, Business Profiles
--   Person area ACLs, parallel AuthZ, ChatRoom
--
-- STOP: Do not apply until Wave B SQL review is explicitly approved.

-- ---------------------------------------------------------------------------
-- official_entity_profiles
-- ---------------------------------------------------------------------------

create table public.official_entity_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  territory_id uuid not null,
  kind text not null,
  slug text not null,
  name text not null,
  description text,
  status text not null default 'draft',
  verification_level text,
  image_url text,
  primary_community_area_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint official_entity_profiles_tenant_id_fkey
    foreign key (tenant_id) references public.tenants (id)
    on delete restrict,

  constraint official_entity_profiles_territory_id_fkey
    foreign key (territory_id) references public.territories (id)
    on delete restrict,

  constraint official_entity_profiles_primary_community_area_id_fkey
    foreign key (primary_community_area_id) references public.community_areas (id)
    on delete restrict,

  constraint official_entity_profiles_territory_slug_unique
    unique (territory_id, slug),

  constraint official_entity_profiles_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),

  constraint official_entity_profiles_name_not_empty check (
    length(trim(name)) > 0
  ),

  constraint official_entity_profiles_kind_allowed check (
    kind in (
      'territory_authority',
      'municipality',
      'public_service',
      'other_official'
    )
  ),

  constraint official_entity_profiles_status_allowed check (
    status in (
      'draft',
      'pending_verification',
      'verified',
      'suspended',
      'archived'
    )
  ),

  constraint official_entity_profiles_verification_level_allowed check (
    verification_level is null
    or verification_level in (
      'official_verified',
      'business_verified',
      'community_member',
      'unverified'
    )
  )
);

comment on table public.official_entity_profiles is
  'Verified institutional representation (ADR-016 / ADR-042). '
  'Territory Authority is kind = territory_authority (product alias), not a separate table. '
  'Not Person, Membership, Business Profile, LocalEntity, or AuthZ. '
  'Commercial entities are deferred (business_profiles / LocalEntity later). '
  'Future Official Channels (Wave C) own via owner_kind = official_entity + owner_id. '
  'Does not bypass residency rules (ADR-037 / ADR-038).';

comment on column public.official_entity_profiles.tenant_id is
  'Denormalized Tenant for RLS. Must match territories.tenant_id for territory_id.';

comment on column public.official_entity_profiles.territory_id is
  'Territory scope (mandatory). Isolation path: territory → tenant.';

comment on column public.official_entity_profiles.kind is
  'Institutional classification. territory_authority is the Territory Authority alias.';

comment on column public.official_entity_profiles.status is
  'ADR-016 lifecycle. Privileged official behaviour requires verified (AuthZ/app).';

comment on column public.official_entity_profiles.verification_level is
  'Public trust signal (types VerificationLevel). Not a Permission.';

comment on column public.official_entity_profiles.primary_community_area_id is
  'Optional organizational home area within the same Territory. Not isolation.';

-- At most one non-archived Territory Authority per Territory
create unique index official_entity_profiles_one_authority_per_territory_idx
  on public.official_entity_profiles (territory_id)
  where kind = 'territory_authority'
    and status is distinct from 'archived';

create index official_entity_profiles_tenant_id_idx
  on public.official_entity_profiles (tenant_id);

create index official_entity_profiles_territory_id_idx
  on public.official_entity_profiles (territory_id);

create index official_entity_profiles_kind_idx
  on public.official_entity_profiles (kind);

create index official_entity_profiles_status_idx
  on public.official_entity_profiles (status);

create index official_entity_profiles_primary_community_area_id_idx
  on public.official_entity_profiles (primary_community_area_id)
  where primary_community_area_id is not null;

-- ---------------------------------------------------------------------------
-- Consistency: tenant_id must match territory.tenant_id
-- ---------------------------------------------------------------------------

create or replace function public.official_entity_profiles_enforce_tenant_match()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  select t.tenant_id
    into v_tenant_id
  from public.territories t
  where t.id = new.territory_id;

  if v_tenant_id is null then
    raise exception
      'territory_id % does not exist',
      new.territory_id
      using errcode = '23503';
  end if;

  if v_tenant_id is distinct from new.tenant_id then
    raise exception
      'official_entity_profiles.tenant_id must equal territories.tenant_id for territory_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.official_entity_profiles_enforce_tenant_match() is
  'Ensures denormalized tenant_id matches the Territory tenant (ADR-002 / ADR-042).';

create trigger official_entity_profiles_enforce_tenant_match
  before insert or update of tenant_id, territory_id
  on public.official_entity_profiles
  for each row
  execute function public.official_entity_profiles_enforce_tenant_match();

-- ---------------------------------------------------------------------------
-- Consistency: primary_community_area_id same Territory when set
-- ---------------------------------------------------------------------------

create or replace function public.official_entity_profiles_enforce_area_same_territory()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_area_territory_id uuid;
begin
  if new.primary_community_area_id is null then
    return new;
  end if;

  select ca.territory_id
    into v_area_territory_id
  from public.community_areas ca
  where ca.id = new.primary_community_area_id;

  if v_area_territory_id is null then
    raise exception
      'primary_community_area_id % does not exist',
      new.primary_community_area_id
      using errcode = '23503';
  end if;

  if v_area_territory_id is distinct from new.territory_id then
    raise exception
      'primary_community_area_id must belong to the same Territory as territory_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.official_entity_profiles_enforce_area_same_territory() is
  'Ensures optional primary_community_area_id is in the profile Territory (ADR-005).';

create trigger official_entity_profiles_enforce_area_same_territory
  before insert or update of territory_id, primary_community_area_id
  on public.official_entity_profiles
  for each row
  execute function public.official_entity_profiles_enforce_area_same_territory();

-- ---------------------------------------------------------------------------
-- Helper: resolve Territory Authority profile id (ADR-042 foresight for Wave C/D)
-- ---------------------------------------------------------------------------

create or replace function public.app_territory_authority_id(p_territory_id uuid)
returns uuid
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  select oep.id
  from public.official_entity_profiles oep
  where oep.territory_id = p_territory_id
    and oep.kind = 'territory_authority'
    and oep.status = 'verified'
  order by oep.created_at asc
  limit 1;
$$;

comment on function public.app_territory_authority_id(uuid) is
  'Returns verified Territory Authority Official Entity id for a Territory, or null. '
  'Does not grant residency access and is not a parallel AuthZ system.';

revoke all on function public.app_territory_authority_id(uuid) from public;
grant execute on function public.app_territory_authority_id(uuid)
  to anon, authenticated;
