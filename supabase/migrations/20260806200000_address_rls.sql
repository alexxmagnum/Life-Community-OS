-- Life Community OS — Address RLS
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-006-PHYSICAL-LOCATION-MODEL.md
-- Depends on:
--   20260806130000_tenant_isolation_rls.sql (app_current_tenant_id helpers)
--   20260806190000_create_addresses.sql
--
-- Address inherits isolation from Territory.
-- Community Area is organizational only — not an isolation or permission boundary.
-- Isolation path: addresses.territory_id → territories.tenant_id
--   must equal app_current_tenant_id() (bound Tenant Context).
--
-- No tenant_id column. No address-based permissions. No new security boundary.
-- Does not modify existing RLS policies on other tables.
-- Application Tenant Context filtering remains mandatory (defense in depth).

-- ---------------------------------------------------------------------------
-- Enable RLS + FORCE (ordinary sessions cannot skip policies)
-- ---------------------------------------------------------------------------

alter table public.addresses enable row level security;
alter table public.addresses force row level security;

comment on table public.addresses is
  'Physical location inside a Territory (ADR-006). '
  'May optionally belong to a Community Area (organizational only). '
  'Address is NOT a security boundary; Address inherits isolation from Territory: '
  'RLS matches territory_id → territories.tenant_id to the bound Tenant Context (ADR-003). '
  'No tenant_id column; no address-based permissions. '
  'GRANT allows table access; RLS controls which rows are visible. '
  'Future Property and Person models will reference Address. '
  'Application Tenant Context filtering remains mandatory.';

-- ---------------------------------------------------------------------------
-- Policies: addresses (Territory → Tenant path)
-- ---------------------------------------------------------------------------

create policy addresses_select_via_territory_tenant
  on public.addresses
  for select
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = addresses.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy addresses_insert_via_territory_tenant
  on public.addresses
  for insert
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = addresses.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
    and (
      community_area_id is null
      or exists (
        select 1
        from public.community_areas ca
        where ca.id = addresses.community_area_id
          and ca.territory_id = addresses.territory_id
      )
    )
  );

create policy addresses_update_via_territory_tenant
  on public.addresses
  for update
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = addresses.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  )
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = addresses.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
    and (
      community_area_id is null
      or exists (
        select 1
        from public.community_areas ca
        where ca.id = addresses.community_area_id
          and ca.territory_id = addresses.territory_id
      )
    )
  );

create policy addresses_delete_via_territory_tenant
  on public.addresses
  for delete
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = addresses.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants: authenticated may operate; RLS still enforces tenant isolation
-- ---------------------------------------------------------------------------

grant select, insert, update, delete
  on table public.addresses
  to authenticated;
