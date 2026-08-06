-- Life Community OS — Seed: Life Panoramica ecosystem root
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-001-FOUNDATION-IDENTITY-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-002-TENANT-ISOLATION-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-004-COMMUNITY-GEOGRAPHIC-MODEL.md
--
-- Creates only the first real SaaS customer/ecosystem root:
--   Tenant    → Life Panoramica
--   Territory → Life Panoramica (community isolation boundary)
--
-- Does NOT create: persons, memberships, identities, community areas,
-- addresses, properties, or users.
--
-- UUID strategy (deterministic):
--   Tenant:    10000000-0000-4000-8000-000000000001
--   Territory: 10000000-0000-4000-8000-000000000002
-- Fixed UUIDs keep seeds stable across environments and re-runs.
--
-- Idempotency: INSERT … ON CONFLICT (id) DO NOTHING, then assert expected rows.

-- ---------------------------------------------------------------------------
-- Tenant: Life Panoramica
-- First real SaaS customer / ecosystem instance.
-- Isolation and commercial root (ADR-001 / ADR-002).
-- ---------------------------------------------------------------------------

insert into public.tenants (
  id,
  public_slug,
  display_name,
  configuration,
  status
)
values (
  '10000000-0000-4000-8000-000000000001'::uuid,
  'life-panoramica',
  'Life Panoramica',
  '{}'::jsonb,
  'active'
)
on conflict (id) do nothing;

do $$
declare
  v_slug text;
begin
  select public_slug into v_slug
  from public.tenants
  where id = '10000000-0000-4000-8000-000000000001'::uuid;

  if v_slug is null then
    raise exception
      'Seed failed: Life Panoramica tenant was not inserted'
      using errcode = 'P0001';
  end if;

  if v_slug is distinct from 'life-panoramica' then
    raise exception
      'Seed conflict: deterministic tenant id exists with unexpected public_slug %',
      v_slug
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.tenants
    where public_slug = 'life-panoramica'
      and id is distinct from '10000000-0000-4000-8000-000000000001'::uuid
  ) then
    raise exception
      'Seed conflict: public_slug life-panoramica exists under a different tenant id'
      using errcode = 'P0001';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Territory: Life Panoramica
-- Main community environment for the Life Panoramica Tenant.
-- Territory is the community isolation boundary (ADR-001 / ADR-004).
-- Future geographic subdivisions (Aldea Golf, Detinsa, Pinar, …) will use
-- Community Areas inside this Territory — organizational only, not a
-- security boundary (ADR-004).
-- ---------------------------------------------------------------------------

insert into public.territories (
  id,
  tenant_id,
  name,
  description
)
values (
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000001'::uuid,
  'Life Panoramica',
  'Main territory for Life Panoramica community'
)
on conflict (id) do nothing;

do $$
declare
  v_tenant_id uuid;
  v_name text;
begin
  select tenant_id, name into v_tenant_id, v_name
  from public.territories
  where id = '10000000-0000-4000-8000-000000000002'::uuid;

  if v_tenant_id is null then
    raise exception
      'Seed failed: Life Panoramica territory was not inserted'
      using errcode = 'P0001';
  end if;

  if v_tenant_id is distinct from '10000000-0000-4000-8000-000000000001'::uuid then
    raise exception
      'Seed conflict: territory is not linked to the Life Panoramica tenant'
      using errcode = 'P0001';
  end if;

  if v_name is distinct from 'Life Panoramica' then
    raise exception
      'Seed conflict: deterministic territory id exists with unexpected name %',
      v_name
      using errcode = 'P0001';
  end if;
end $$;
