-- Life Community OS — Property Person Relationship RLS
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-008-PROPERTY-PERSON-RELATIONSHIP-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-009-PROPERTY-PERSON-RELATIONSHIP-SCHEMA.md
-- Depends on:
--   20260806130000_tenant_isolation_rls.sql (app_current_tenant_id helpers)
--   20260806210000_create_properties.sql
--   20260806230000_create_property_person_relationships.sql
--
-- Property Person Relationship is NOT a security boundary.
-- Relationship inherits tenant isolation through Property.
-- Person ownership/access will be modeled separately (Membership + Authorization).
--
-- Isolation path:
--   property_person_relationships.property_id
--     → properties.address_id
--       → addresses.territory_id
--         → territories.tenant_id
--           = app_current_tenant_id()
--
-- No tenant_id column. No person security boundary. No permissions.
-- Does not modify existing RLS policies. Does not create person tables.
-- Application Tenant Context filtering remains mandatory (defense in depth).

-- ---------------------------------------------------------------------------
-- Enable RLS + FORCE (ordinary sessions cannot skip policies)
-- ---------------------------------------------------------------------------

alter table public.property_person_relationships enable row level security;
alter table public.property_person_relationships force row level security;

comment on table public.property_person_relationships is
  'Roles between People and Properties (ADR-008 / ADR-009). '
  'Independent relationship entity: Property → Property Person Relationship → Person. '
  'Property does not own Person. Relationship is NOT a security boundary. '
  'Relationship inherits tenant isolation through Property → Address → Territory → Tenant (ADR-003). '
  'Person ownership/access will be modeled separately (Membership + Authorization). '
  'Domain type tenant means renter — never SaaS Tenant. '
  'GRANT allows table access; RLS controls which rows are visible. '
  'Application Tenant Context filtering remains mandatory.';

-- ---------------------------------------------------------------------------
-- Policies: property_person_relationships
-- (Property → Address → Territory → Tenant path)
-- ---------------------------------------------------------------------------

create policy property_person_relationships_select_via_property_tenant
  on public.property_person_relationships
  for select
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.properties p
      inner join public.addresses a on a.id = p.address_id
      inner join public.territories t on t.id = a.territory_id
      where p.id = property_person_relationships.property_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy property_person_relationships_insert_via_property_tenant
  on public.property_person_relationships
  for insert
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.properties p
      inner join public.addresses a on a.id = p.address_id
      inner join public.territories t on t.id = a.territory_id
      where p.id = property_person_relationships.property_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy property_person_relationships_update_via_property_tenant
  on public.property_person_relationships
  for update
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.properties p
      inner join public.addresses a on a.id = p.address_id
      inner join public.territories t on t.id = a.territory_id
      where p.id = property_person_relationships.property_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  )
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.properties p
      inner join public.addresses a on a.id = p.address_id
      inner join public.territories t on t.id = a.territory_id
      where p.id = property_person_relationships.property_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy property_person_relationships_delete_via_property_tenant
  on public.property_person_relationships
  for delete
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.properties p
      inner join public.addresses a on a.id = p.address_id
      inner join public.territories t on t.id = a.territory_id
      where p.id = property_person_relationships.property_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants: authenticated may operate; RLS still enforces tenant isolation
-- ---------------------------------------------------------------------------

grant select, insert, update, delete
  on table public.property_person_relationships
  to authenticated;
