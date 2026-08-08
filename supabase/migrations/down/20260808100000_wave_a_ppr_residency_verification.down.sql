-- Life Community OS — Wave A ROLLBACK
-- Reverses: 20260808100000_wave_a_ppr_residency_verification.sql
--
-- Apply manually only if Wave A forward migration must be undone.
-- Order matters: drop dependents before restoring prior PPR CHECKs.
--
-- Safe only when:
--   - No Wave B+ tables depend on these objects
--   - No production rows require pending_verification / family_member / etc.
--     that would violate the restored narrower CHECKs
--
-- Never drops: tenants, territories, persons, memberships, properties,
-- addresses, community_areas, or the property_person_relationships table itself.

-- ---------------------------------------------------------------------------
-- 1. Drop evidence + verification RLS policies (tables dropped next)
-- ---------------------------------------------------------------------------

drop policy if exists residency_verification_evidence_delete_via_verification_tenant
  on public.residency_verification_evidence;
drop policy if exists residency_verification_evidence_update_via_verification_tenant
  on public.residency_verification_evidence;
drop policy if exists residency_verification_evidence_insert_via_verification_tenant
  on public.residency_verification_evidence;
drop policy if exists residency_verification_evidence_select_via_verification_tenant
  on public.residency_verification_evidence;

drop policy if exists residency_verifications_delete_via_territory_tenant
  on public.residency_verifications;
drop policy if exists residency_verifications_update_via_territory_tenant
  on public.residency_verifications;
drop policy if exists residency_verifications_insert_via_territory_tenant
  on public.residency_verifications;
drop policy if exists residency_verifications_select_via_territory_tenant
  on public.residency_verifications;

-- ---------------------------------------------------------------------------
-- 2. Drop ADR-037 helper
-- ---------------------------------------------------------------------------

revoke all on function public.app_person_verified_community_area_ids(uuid) from public;
revoke all on function public.app_person_verified_community_area_ids(uuid) from anon, authenticated;
drop function if exists public.app_person_verified_community_area_ids(uuid);

-- ---------------------------------------------------------------------------
-- 3. Drop consistency triggers + functions
-- ---------------------------------------------------------------------------

drop trigger if exists residency_verifications_enforce_area_same_territory
  on public.residency_verifications;
drop function if exists public.residency_verifications_enforce_area_same_territory();

drop trigger if exists residency_verifications_enforce_person_match
  on public.residency_verifications;
drop function if exists public.residency_verifications_enforce_person_match();

-- ---------------------------------------------------------------------------
-- 4. Clear PPR.verification_id FK + columns added in Wave A
-- ---------------------------------------------------------------------------

alter table public.property_person_relationships
  drop constraint if exists property_person_relationships_verification_id_fkey;

drop index if exists public.property_person_relationships_verification_id_idx;

alter table public.property_person_relationships
  drop column if exists verification_id;

alter table public.property_person_relationships
  drop column if exists verified_at;

-- ---------------------------------------------------------------------------
-- 5. Drop new tables (evidence first — CASCADE from verification also works)
-- ---------------------------------------------------------------------------

drop table if exists public.residency_verification_evidence;
drop table if exists public.residency_verifications;

-- ---------------------------------------------------------------------------
-- 6. Restore prior PPR CHECKs (from 20260806230000)
--
-- PRECHECK REQUIRED before this step:
--   select distinct relationship_type from property_person_relationships;
--   select distinct status from property_person_relationships;
-- Rows using family_member/guest/staff or pending_verification/rejected/ended
-- must be cleaned or remapped first or this ALTER will fail.
-- ---------------------------------------------------------------------------

alter table public.property_person_relationships
  drop constraint if exists property_person_relationships_type_allowed;

alter table public.property_person_relationships
  add constraint property_person_relationships_type_allowed check (
    relationship_type in (
      'owner',
      'resident',
      'tenant',
      'authorized_person',
      'manager'
    )
  );

alter table public.property_person_relationships
  drop constraint if exists property_person_relationships_status_allowed;

alter table public.property_person_relationships
  add constraint property_person_relationships_status_allowed check (
    status in (
      'active',
      'inactive',
      'archived'
    )
  );

comment on column public.property_person_relationships.relationship_type is
  'Role classification only (owner, resident, tenant/renter, authorized_person, manager). '
  'Never a permission or isolation key.';

comment on column public.property_person_relationships.status is
  'Lifecycle status: active, inactive, or archived.';

comment on table public.property_person_relationships is
  'Roles between People and Properties (ADR-008 / ADR-009). '
  'Independent relationship entity: Property → Property Person Relationship → Person. '
  'Property does not own Person. Relationship is NOT a security boundary. '
  'Relationship inherits tenant isolation through Property → Address → Territory → Tenant (ADR-003). '
  'Person ownership/access will be modeled separately (Membership + Authorization). '
  'Domain type tenant means renter — never SaaS Tenant. '
  'GRANT allows table access; RLS controls which rows are visible. '
  'Application Tenant Context filtering remains mandatory.';
