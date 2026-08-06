-- Life Community OS — Community Area RLS
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-005-COMMUNITY-AREA-MODEL.md
-- Depends on:
--   20260806130000_tenant_isolation_rls.sql (app_current_tenant_id helpers)
--   20260806160000_create_community_areas.sql
--
-- Community Areas inherit security from Territory.
-- They are NOT a new isolation boundary and NOT area-based security.
-- Isolation path: community_areas.territory_id → territories.tenant_id
--   must equal app_current_tenant_id() (bound Tenant Context).
--
-- No tenant_id column. No modification of existing table policies.
-- Application Tenant Context filtering remains mandatory (defense in depth).

-- ---------------------------------------------------------------------------
-- Enable RLS + FORCE (ordinary sessions cannot skip policies)
-- ---------------------------------------------------------------------------

alter table public.community_areas enable row level security;
alter table public.community_areas force row level security;

comment on table public.community_areas is
  'Organizational geographic subdivision inside a Territory (ADR-004 / ADR-005). '
  'NOT a Tenant, NOT a security boundary, NOT an authorization boundary. '
  'Community Areas inherit security from Territory: RLS matches '
  'territory_id → territories.tenant_id to the bound Tenant Context (ADR-003). '
  'No tenant_id column; no area-based isolation. '
  'GRANT allows table access; RLS controls which rows are visible. '
  'Application Tenant Context filtering remains mandatory.';

-- ---------------------------------------------------------------------------
-- Policies: community_areas (Territory → Tenant path)
-- ---------------------------------------------------------------------------

create policy community_areas_select_via_territory_tenant
  on public.community_areas
  for select
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = community_areas.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy community_areas_insert_via_territory_tenant
  on public.community_areas
  for insert
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = community_areas.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy community_areas_update_via_territory_tenant
  on public.community_areas
  for update
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = community_areas.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  )
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = community_areas.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy community_areas_delete_via_territory_tenant
  on public.community_areas
  for delete
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = community_areas.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants: authenticated may operate; RLS still enforces tenant isolation
-- ---------------------------------------------------------------------------

grant select, insert, update, delete
  on table public.community_areas
  to authenticated;
