-- Life Community OS — Seed: Life Panoramica Community Areas
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-004-COMMUNITY-GEOGRAPHIC-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-005-COMMUNITY-AREA-MODEL.md
-- Depends on:
--   20260806150000_seed_life_panoramica.sql (Territory)
--   20260806160000_create_community_areas.sql
--
-- Seeds geographic organization units inside the Life Panoramica Territory.
-- These Community Areas are NOT Tenants, NOT security boundaries, and NOT
-- authorization boundaries. Isolation continues through Territory → Tenant.
--
-- Does NOT create: persons, memberships, addresses, properties, businesses,
-- services, or security/RLS rules.
--
-- UUID strategy (deterministic):
--   Territory (existing): 10000000-0000-4000-8000-000000000002
--   Aldea Golf:           10000000-0000-4000-8000-000000000011
--   Detinsa:              10000000-0000-4000-8000-000000000012
--   Pinar:                10000000-0000-4000-8000-000000000013
--   Golfmar:              10000000-0000-4000-8000-000000000014
--   Hacienda:             10000000-0000-4000-8000-000000000015
--   Valle Golf:           10000000-0000-4000-8000-000000000016
--   Zona general:         10000000-0000-4000-8000-000000000017
--
-- Idempotency: ON CONFLICT (id) DO NOTHING.
-- Unique (territory_id, slug) still protects against duplicate slugs.

do $$
begin
  if not exists (
    select 1
    from public.territories
    where id = '10000000-0000-4000-8000-000000000002'::uuid
      and name = 'Life Panoramica'
  ) then
    raise exception
      'Seed prerequisite missing: Life Panoramica territory 10000000-0000-4000-8000-000000000002'
      using errcode = 'P0001';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Community Areas under Territory Life Panoramica
-- parent_area_id remains null (flat organization for this seed)
-- ---------------------------------------------------------------------------

insert into public.community_areas (
  id,
  territory_id,
  parent_area_id,
  name,
  slug,
  type,
  description,
  status
)
values
  (
    '10000000-0000-4000-8000-000000000011'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    null,
    'Aldea Golf',
    'aldea-golf',
    'urbanization',
    'Geographic organization unit inside Life Panoramica Territory. Not a security boundary.',
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000012'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    null,
    'Detinsa',
    'detinsa',
    'urbanization',
    'Geographic organization unit inside Life Panoramica Territory. Not a security boundary.',
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000013'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    null,
    'Pinar',
    'pinar',
    'urbanization',
    'Geographic organization unit inside Life Panoramica Territory. Not a security boundary.',
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000014'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    null,
    'Golfmar',
    'golfmar',
    'urbanization',
    'Geographic organization unit inside Life Panoramica Territory. Not a security boundary.',
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000015'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    null,
    'Hacienda',
    'hacienda',
    'urbanization',
    'Geographic organization unit inside Life Panoramica Territory. Not a security boundary.',
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000016'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    null,
    'Valle Golf',
    'valle-golf',
    'urbanization',
    'Geographic organization unit inside Life Panoramica Territory. Not a security boundary.',
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000017'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    null,
    'Zona general',
    'zona-general',
    'zone',
    'Catch-all organizational zone for streets and residential areas without a named micro-urbanization. Not a security boundary.',
    'active'
  )
on conflict (id) do nothing;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.community_areas
  where territory_id = '10000000-0000-4000-8000-000000000002'::uuid
    and id in (
      '10000000-0000-4000-8000-000000000011'::uuid,
      '10000000-0000-4000-8000-000000000012'::uuid,
      '10000000-0000-4000-8000-000000000013'::uuid,
      '10000000-0000-4000-8000-000000000014'::uuid,
      '10000000-0000-4000-8000-000000000015'::uuid,
      '10000000-0000-4000-8000-000000000016'::uuid,
      '10000000-0000-4000-8000-000000000017'::uuid
    )
    and parent_area_id is null;

  if v_count <> 7 then
    raise exception
      'Seed failed: expected 7 Life Panoramica community areas with null parent_area_id, found %',
      v_count
      using errcode = 'P0001';
  end if;
end $$;
