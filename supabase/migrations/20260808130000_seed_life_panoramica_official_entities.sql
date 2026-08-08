-- Life Community OS — Wave B seed: Life Panoramica Official Entities (demo only)
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-016-OFFICIAL-ENTITIES-BUSINESS-PROFILES-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-042-WAVE-B-TERRITORY-AUTHORITY-PERSISTENCE-DESIGN.md
-- Depends on:
--   20260806150000_seed_life_panoramica.sql
--   20260808110000_create_official_entity_profiles.sql
--
-- Demo seeds ONLY (deterministic UUIDs).
-- Production Official Entities must be created through normal application flows.
--
-- UUID strategy (deterministic demo):
--   Tenant (existing):                 10000000-0000-4000-8000-000000000001
--   Territory (existing):              10000000-0000-4000-8000-000000000002
--   Panoramica Golf Administration:    10000000-0000-4000-8000-000000000021
--   Municipality (demo):               10000000-0000-4000-8000-000000000022
--
-- Demo catalog string ids (oe-panoramica-admin / oe-municipality-demo) are NOT
-- SQL primary keys; cutover maps catalog → these UUIDs later.
--
-- STOP: Do not apply until Wave B SQL review is explicitly approved.

do $$
begin
  if not exists (
    select 1
    from public.tenants
    where id = '10000000-0000-4000-8000-000000000001'::uuid
  ) then
    raise exception
      'Seed prerequisite missing: Life Panoramica tenant 10000000-0000-4000-8000-000000000001'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.territories
    where id = '10000000-0000-4000-8000-000000000002'::uuid
      and tenant_id = '10000000-0000-4000-8000-000000000001'::uuid
  ) then
    raise exception
      'Seed prerequisite missing: Life Panoramica territory 10000000-0000-4000-8000-000000000002'
      using errcode = 'P0001';
  end if;
end $$;

insert into public.official_entity_profiles (
  id,
  tenant_id,
  territory_id,
  kind,
  slug,
  name,
  description,
  status,
  verification_level,
  image_url,
  metadata
)
values
  (
    '10000000-0000-4000-8000-000000000021'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    'territory_authority',
    'panoramica-golf-administration',
    'Panoramica Golf Administration',
    'Territory Authority for Panoramica Golf: official communication, territorial resources, and residency verification.',
    'verified',
    'official_verified',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    jsonb_build_object(
      'demo_catalog_id', 'oe-panoramica-admin',
      'seed', 'life-panoramica-wave-b'
    )
  ),
  (
    '10000000-0000-4000-8000-000000000022'::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    'municipality',
    'municipality-demo',
    'Municipality (demo)',
    'Demo municipal official entity for public notices. Not a production government integration.',
    'verified',
    'official_verified',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
    jsonb_build_object(
      'demo_catalog_id', 'oe-municipality-demo',
      'seed', 'life-panoramica-wave-b'
    )
  )
on conflict (id) do nothing;

do $$
declare
  v_kind text;
begin
  select kind into v_kind
  from public.official_entity_profiles
  where id = '10000000-0000-4000-8000-000000000021'::uuid;

  if v_kind is null then
    raise exception
      'Seed failed: Panoramica Golf Administration was not inserted'
      using errcode = 'P0001';
  end if;

  if v_kind is distinct from 'territory_authority' then
    raise exception
      'Seed conflict: Administration id exists with unexpected kind %',
      v_kind
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.official_entity_profiles
    where id = '10000000-0000-4000-8000-000000000022'::uuid
      and kind = 'municipality'
  ) then
    raise exception
      'Seed failed: Municipality (demo) was not inserted'
      using errcode = 'P0001';
  end if;
end $$;
