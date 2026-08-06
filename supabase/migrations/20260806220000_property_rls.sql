-- Life Community OS — Property RLS
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-007-PROPERTY-MODEL.md
-- Depends on:
--   20260806130000_tenant_isolation_rls.sql (app_current_tenant_id helpers)
--   20260806190000_create_addresses.sql
--   20260806210000_create_properties.sql
--
-- Property inherits isolation through Address → Territory → Tenant.
-- Property is NOT a security boundary and does NOT create property-level isolation.
-- Future Person relationships (owner, resident, tenant, authorized_person) will be
-- modeled separately — this migration does not add owner/resident columns.
--
-- Isolation path:
--   properties.address_id → addresses.territory_id → territories.tenant_id
--   must equal app_current_tenant_id() (bound Tenant Context).
--
-- No tenant_id column. Does not modify existing RLS policies on other tables.
-- Application Tenant Context filtering remains mandatory (defense in depth).

-- ---------------------------------------------------------------------------
-- Enable RLS + FORCE (ordinary sessions cannot skip policies)
-- ---------------------------------------------------------------------------

alter table public.properties enable row level security;
alter table public.properties force row level security;

comment on table public.properties is
  'Real estate unit located at an Address (ADR-007). '
  'Property is NOT a security boundary; Property inherits isolation through '
  'Address → Territory → Tenant (ADR-003). '
  'No tenant_id column; no property-level isolation. '
  'Property does not own people. Future Person relationships will be modeled '
  'separately through roles: owner, resident, tenant, authorized_person. '
  'GRANT allows table access; RLS controls which rows are visible. '
  'Application Tenant Context filtering remains mandatory.';

-- ---------------------------------------------------------------------------
-- Policies: properties (Address → Territory → Tenant path)
-- ---------------------------------------------------------------------------

create policy properties_select_via_address_territory_tenant
  on public.properties
  for select
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.addresses a
      inner join public.territories t on t.id = a.territory_id
      where a.id = properties.address_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy properties_insert_via_address_territory_tenant
  on public.properties
  for insert
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.addresses a
      inner join public.territories t on t.id = a.territory_id
      where a.id = properties.address_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy properties_update_via_address_territory_tenant
  on public.properties
  for update
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.addresses a
      inner join public.territories t on t.id = a.territory_id
      where a.id = properties.address_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  )
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.addresses a
      inner join public.territories t on t.id = a.territory_id
      where a.id = properties.address_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy properties_delete_via_address_territory_tenant
  on public.properties
  for delete
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.addresses a
      inner join public.territories t on t.id = a.territory_id
      where a.id = properties.address_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants: authenticated may operate; RLS still enforces tenant isolation
-- ---------------------------------------------------------------------------

grant select, insert, update, delete
  on table public.properties
  to authenticated;
