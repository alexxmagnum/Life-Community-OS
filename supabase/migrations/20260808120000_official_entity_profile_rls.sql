-- Life Community OS — Wave B: Official Entity Profile RLS
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-003-DATABASE-SECURITY-RLS-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-042-WAVE-B-TERRITORY-AUTHORITY-PERSISTENCE-DESIGN.md
-- Depends on:
--   20260806130000_tenant_isolation_rls.sql
--   20260808110000_create_official_entity_profiles.sql
--
-- Isolation: tenant_id = app_current_tenant_id() (fail closed).
-- AuthZ for create/publish/manage remains Platform RBAC (ADR-012 / ADR-040).
-- RLS does not encode Authority privileges or bypass residency.
--
-- STOP: Do not apply until Wave B SQL review is explicitly approved.

alter table public.official_entity_profiles enable row level security;
alter table public.official_entity_profiles force row level security;

create policy official_entity_profiles_select_via_tenant
  on public.official_entity_profiles
  for select
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

create policy official_entity_profiles_insert_via_tenant
  on public.official_entity_profiles
  for insert
  with check (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
    and exists (
      select 1
      from public.territories t
      where t.id = official_entity_profiles.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy official_entity_profiles_update_via_tenant
  on public.official_entity_profiles
  for update
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  )
  with check (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
    and exists (
      select 1
      from public.territories t
      where t.id = official_entity_profiles.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy official_entity_profiles_delete_via_tenant
  on public.official_entity_profiles
  for delete
  using (
    public.app_has_tenant_context()
    and tenant_id = public.app_current_tenant_id()
  );

grant select, insert, update, delete
  on table public.official_entity_profiles
  to authenticated;

comment on table public.official_entity_profiles is
  'Verified institutional representation (ADR-016 / ADR-042). '
  'Territory Authority is kind = territory_authority (product alias), not a separate table. '
  'Not Person, Membership, Business Profile, LocalEntity, or AuthZ. '
  'Commercial entities are deferred (business_profiles / LocalEntity later). '
  'Future Official Channels (Wave C) own via owner_kind = official_entity + owner_id. '
  'Does not bypass residency rules (ADR-037 / ADR-038). '
  'RLS: tenant_id must equal bound Tenant Context (ADR-003). '
  'Application Tenant Context filtering and RBAC remain mandatory.';
