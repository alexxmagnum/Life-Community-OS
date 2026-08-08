-- Life Community OS — Wave A: PPR alignment + Residency Verification foundation
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-037-RESIDENCY-DERIVED-ACCESS-MODEL.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-038-RESIDENCY-VERIFICATION-WORKFLOW.md
-- ADR: docs/006_ARCHITECTURE_DECISIONS/ADR-041-PHASE-2-PERSISTENCE-FOUNDATION-PLAN.md
-- Plan: docs/013_DATA_MODEL/10_PHASE_2_PERSISTENCE_FOUNDATION_PLAN.md (§5 / Wave A)
-- Review: docs/013_DATA_MODEL/11_WAVE_A_MIGRATION_SQL_REVIEW.md
-- Depends on:
--   20260806130000_tenant_isolation_rls.sql
--   20260806160000_create_community_areas.sql
--   20260806230000_create_property_person_relationships.sql
--   20260806240000_property_person_relationship_rls.sql
--
-- Scope (Wave A only):
--   - Expand PPR relationship_type / status CHECKs
--   - Add verified_at + verification_id on PPR
--   - Create residency_verifications + residency_verification_evidence
--   - Required constraints, triggers, RLS, grants
--   - SQL helper: app_person_verified_community_area_ids (ADR-037 derivation)
--
-- Explicitly out of scope:
--   Channels, Groups, Resources, Experiences, Local Entities / Official Entities
--   Area permission lists on persons
--   Core Files table (file_id is a soft reference only)
--   Seed / demo data
--
-- STOP: Do not apply until Wave A SQL review is explicitly approved.

-- ---------------------------------------------------------------------------
-- 1. Expand PropertyPersonRelationship CHECKs (backward-compatible)
-- ---------------------------------------------------------------------------

alter table public.property_person_relationships
  drop constraint property_person_relationships_type_allowed;

alter table public.property_person_relationships
  add constraint property_person_relationships_type_allowed check (
    relationship_type in (
      'owner',
      'resident',
      'tenant',
      'family_member',
      'guest',
      'staff',
      'authorized_person',
      'manager'
    )
  );

alter table public.property_person_relationships
  drop constraint property_person_relationships_status_allowed;

alter table public.property_person_relationships
  add constraint property_person_relationships_status_allowed check (
    status in (
      'pending_verification',
      'active',
      'inactive',
      'ended',
      'archived',
      'rejected'
    )
  );

comment on column public.property_person_relationships.relationship_type is
  'Role classification only (owner, resident, tenant/renter, family_member, guest, '
  'staff, authorized_person, manager). Never a permission or isolation key. '
  'Default eligibility roles for area derivation: owner, resident, tenant, family_member (ADR-037).';

comment on column public.property_person_relationships.status is
  'Lifecycle: pending_verification (claim — no restricted access), active (verified/'
  'in effect), inactive, ended, archived, rejected (ADR-038). '
  'Only status = active (+ temporal validity) contributes Community Area eligibility.';

-- ---------------------------------------------------------------------------
-- 2. Add verified_at (verification_id FK added after residency_verifications)
-- ---------------------------------------------------------------------------

alter table public.property_person_relationships
  add column verified_at timestamptz;

comment on column public.property_person_relationships.verified_at is
  'When the relationship was activated via ResidencyVerification (ADR-038). '
  'Null when never verified through that workflow (or not applicable).';

-- Keep default status = active for backward compatibility with foundation inserts.
-- Claim flows MUST set status = pending_verification explicitly (ADR-038).

-- ---------------------------------------------------------------------------
-- 3. residency_verifications
-- ---------------------------------------------------------------------------

create table public.residency_verifications (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null,
  person_id uuid not null,
  territory_id uuid not null,
  community_area_id uuid,
  method text not null,
  status text not null default 'draft',
  reviewed_by_person_id uuid,
  decision_note text,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint residency_verifications_relationship_id_fkey
    foreign key (relationship_id) references public.property_person_relationships (id)
    on delete restrict,

  constraint residency_verifications_person_id_fkey
    foreign key (person_id) references public.persons (id)
    on delete restrict,

  constraint residency_verifications_territory_id_fkey
    foreign key (territory_id) references public.territories (id)
    on delete restrict,

  constraint residency_verifications_community_area_id_fkey
    foreign key (community_area_id) references public.community_areas (id)
    on delete restrict,

  constraint residency_verifications_reviewed_by_person_id_fkey
    foreign key (reviewed_by_person_id) references public.persons (id)
    on delete restrict,

  constraint residency_verifications_method_allowed check (
    method in (
      'residency_certificate',
      'owner_invitation',
      'administration_approval',
      'approved_documentation'
    )
  ),

  constraint residency_verifications_status_allowed check (
    status in (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'cancelled'
    )
  ),

  constraint residency_verifications_decision_timestamps check (
    (status in ('approved', 'rejected') and decided_at is not null)
    or (status not in ('approved', 'rejected'))
  )
);

comment on table public.residency_verifications is
  'Residency verification case (ADR-038). Claim ≠ access. '
  'Approving a case may activate PropertyPersonRelationship; it does not grant RBAC. '
  'Evidence is never stored on Person — use residency_verification_evidence + Core Files. '
  'Isolation: territory_id → territories.tenant_id = app_current_tenant_id().';

comment on column public.residency_verifications.relationship_id is
  'PropertyPersonRelationship under review (claim row).';

comment on column public.residency_verifications.person_id is
  'Claimant Person (denormalized for queries). Must match relationship.person_id. '
  'Not a document vault.';

comment on column public.residency_verifications.territory_id is
  'Territory scope of the claim. Isolation root path for RLS.';

comment on column public.residency_verifications.community_area_id is
  'Optional Community Area of the claim (same Territory). Derived at submit from '
  'Property → Address when available; not an ACL on Person.';

comment on column public.residency_verifications.method is
  'Verification method per ADR-038.';

comment on column public.residency_verifications.status is
  'Case lifecycle: draft → submitted → under_review → approved|rejected|cancelled.';

comment on column public.residency_verifications.decision_note is
  'Non-sensitive review note. Must not embed document binaries.';

create index residency_verifications_relationship_id_idx
  on public.residency_verifications (relationship_id);

create index residency_verifications_person_id_idx
  on public.residency_verifications (person_id);

create index residency_verifications_territory_id_idx
  on public.residency_verifications (territory_id);

create index residency_verifications_community_area_id_idx
  on public.residency_verifications (community_area_id);

create index residency_verifications_status_idx
  on public.residency_verifications (status);

-- ---------------------------------------------------------------------------
-- 4. residency_verification_evidence (Files soft-refs — never on Person)
-- ---------------------------------------------------------------------------

create table public.residency_verification_evidence (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null,
  kind text not null,
  file_id uuid,
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint residency_verification_evidence_verification_id_fkey
    foreign key (verification_id) references public.residency_verifications (id)
    on delete cascade,

  constraint residency_verification_evidence_kind_allowed check (
    kind in (
      'certificate_file',
      'supporting_document_file',
      'owner_invitation_reference',
      'administration_decision_reference'
    )
  ),

  -- Soft Files reference only (ADR-020). No FK until Core Files table exists.
  -- At least one locator required so rows are not empty placeholders.
  constraint residency_verification_evidence_locator_present check (
    file_id is not null
    or (
      external_reference is not null
      and length(trim(external_reference)) > 0
    )
  ),

  -- Guardrail: forbid obvious Person-document blob keys in metadata (ADR-038).
  constraint residency_verification_evidence_no_person_blob check (
    not (metadata ? 'personDocumentBlob')
    and not (metadata ? 'person_document_blob')
    and not (metadata ? 'verification_document')
  )
);

comment on table public.residency_verification_evidence is
  'Evidence for a residency verification case (ADR-038). '
  'file_id references Platform Core Files (soft UUID — no FK in Wave A). '
  'Forbidden: storing document bytes or vault fields on persons.';

comment on column public.residency_verification_evidence.file_id is
  'Core Files id (ADR-020). Soft reference; Files table not required for Wave A.';

comment on column public.residency_verification_evidence.external_reference is
  'Non-file reference (invite id, admin case id). Used when method does not require Files.';

comment on column public.residency_verification_evidence.metadata is
  'Operational attributes only. Must not embed Person document blobs.';

create index residency_verification_evidence_verification_id_idx
  on public.residency_verification_evidence (verification_id);

create index residency_verification_evidence_file_id_idx
  on public.residency_verification_evidence (file_id)
  where file_id is not null;

-- ---------------------------------------------------------------------------
-- 5. PPR.verification_id → residency_verifications (nullable, deferrable)
-- ---------------------------------------------------------------------------

alter table public.property_person_relationships
  add column verification_id uuid;

alter table public.property_person_relationships
  add constraint property_person_relationships_verification_id_fkey
    foreign key (verification_id) references public.residency_verifications (id)
    on delete set null
    deferrable initially deferred;

comment on column public.property_person_relationships.verification_id is
  'ResidencyVerification that activated this relationship when applicable (ADR-038). '
  'Nullable; DEFERRABLE so case + activation can commit in one transaction.';

create index property_person_relationships_verification_id_idx
  on public.property_person_relationships (verification_id)
  where verification_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Consistency triggers (ADR-037 / ADR-038)
-- ---------------------------------------------------------------------------

-- person_id on verification must match relationship.person_id
create or replace function public.residency_verifications_enforce_person_match()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_person_id uuid;
begin
  select ppr.person_id
    into v_person_id
  from public.property_person_relationships ppr
  where ppr.id = new.relationship_id;

  if v_person_id is null then
    raise exception
      'relationship_id % does not exist',
      new.relationship_id
      using errcode = '23503';
  end if;

  if v_person_id is distinct from new.person_id then
    raise exception
      'residency_verifications.person_id must equal property_person_relationships.person_id (ADR-038)'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.residency_verifications_enforce_person_match() is
  'Ensures verification claimant matches the related PropertyPersonRelationship person.';

create trigger residency_verifications_enforce_person_match
  before insert or update of relationship_id, person_id
  on public.residency_verifications
  for each row
  execute function public.residency_verifications_enforce_person_match();

-- community_area_id (when set) must belong to territory_id
create or replace function public.residency_verifications_enforce_area_same_territory()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_area_territory_id uuid;
begin
  if new.community_area_id is null then
    return new;
  end if;

  select ca.territory_id
    into v_area_territory_id
  from public.community_areas ca
  where ca.id = new.community_area_id;

  if v_area_territory_id is null then
    raise exception
      'community_area_id % does not exist',
      new.community_area_id
      using errcode = '23503';
  end if;

  if v_area_territory_id is distinct from new.territory_id then
    raise exception
      'residency_verifications.community_area_id must belong to the same Territory as territory_id'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.residency_verifications_enforce_area_same_territory() is
  'Ensures optional community_area_id belongs to verification territory_id (ADR-005/038).';

create trigger residency_verifications_enforce_area_same_territory
  before insert or update of territory_id, community_area_id
  on public.residency_verifications
  for each row
  execute function public.residency_verifications_enforce_area_same_territory();

-- ---------------------------------------------------------------------------
-- 7. ADR-037 helper: verified Community Area ids from active PPRs
--    (No area ACL on Person. Used later by private channel / resource RLS.)
-- ---------------------------------------------------------------------------

create or replace function public.app_person_verified_community_area_ids(p_person_id uuid)
returns table (community_area_id uuid)
language sql
stable
parallel safe
security invoker
set search_path = public
as $$
  select distinct a.community_area_id
  from public.property_person_relationships ppr
  inner join public.properties p on p.id = ppr.property_id
  inner join public.addresses a on a.id = p.address_id
  where ppr.person_id = p_person_id
    and ppr.status = 'active'
    and ppr.relationship_type in ('owner', 'resident', 'tenant', 'family_member')
    and a.community_area_id is not null
    and (ppr.start_date is null or ppr.start_date <= current_date)
    and (ppr.end_date is null or ppr.end_date >= current_date);
$$;

comment on function public.app_person_verified_community_area_ids(uuid) is
  'ADR-037: Community Area ids derived from active verified residencies only. '
  'pending_verification / rejected / ended never contribute. '
  'Does not read area permission lists from Person. '
  'Default eligibility roles: owner, resident, tenant, family_member.';

revoke all on function public.app_person_verified_community_area_ids(uuid) from public;
grant execute on function public.app_person_verified_community_area_ids(uuid)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. RLS — residency_verifications (Territory → Tenant)
-- ---------------------------------------------------------------------------

alter table public.residency_verifications enable row level security;
alter table public.residency_verifications force row level security;

create policy residency_verifications_select_via_territory_tenant
  on public.residency_verifications
  for select
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = residency_verifications.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy residency_verifications_insert_via_territory_tenant
  on public.residency_verifications
  for insert
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = residency_verifications.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy residency_verifications_update_via_territory_tenant
  on public.residency_verifications
  for update
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = residency_verifications.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  )
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = residency_verifications.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy residency_verifications_delete_via_territory_tenant
  on public.residency_verifications
  for delete
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.territories t
      where t.id = residency_verifications.territory_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

grant select, insert, update, delete
  on table public.residency_verifications
  to authenticated;

-- ---------------------------------------------------------------------------
-- 9. RLS — residency_verification_evidence (via parent verification → Territory)
-- ---------------------------------------------------------------------------

alter table public.residency_verification_evidence enable row level security;
alter table public.residency_verification_evidence force row level security;

create policy residency_verification_evidence_select_via_verification_tenant
  on public.residency_verification_evidence
  for select
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.residency_verifications rv
      inner join public.territories t on t.id = rv.territory_id
      where rv.id = residency_verification_evidence.verification_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy residency_verification_evidence_insert_via_verification_tenant
  on public.residency_verification_evidence
  for insert
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.residency_verifications rv
      inner join public.territories t on t.id = rv.territory_id
      where rv.id = residency_verification_evidence.verification_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy residency_verification_evidence_update_via_verification_tenant
  on public.residency_verification_evidence
  for update
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.residency_verifications rv
      inner join public.territories t on t.id = rv.territory_id
      where rv.id = residency_verification_evidence.verification_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  )
  with check (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.residency_verifications rv
      inner join public.territories t on t.id = rv.territory_id
      where rv.id = residency_verification_evidence.verification_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

create policy residency_verification_evidence_delete_via_verification_tenant
  on public.residency_verification_evidence
  for delete
  using (
    public.app_has_tenant_context()
    and exists (
      select 1
      from public.residency_verifications rv
      inner join public.territories t on t.id = rv.territory_id
      where rv.id = residency_verification_evidence.verification_id
        and t.tenant_id = public.app_current_tenant_id()
    )
  );

grant select, insert, update, delete
  on table public.residency_verification_evidence
  to authenticated;

-- Update PPR table comment for ADR-037/038 lifecycle (RLS policies unchanged).
comment on table public.property_person_relationships is
  'Roles between People and Properties (ADR-008 / ADR-009 / ADR-037 / ADR-038). '
  'Independent relationship entity: Property → Property Person Relationship → Person. '
  'Property does not own Person. Relationship is NOT a security boundary. '
  'Claim status pending_verification never grants restricted access; only active '
  '(+ dates) contributes Community Area eligibility (ADR-037). '
  'Isolation inherits through Property → Address → Territory → Tenant (ADR-003). '
  'Application Tenant Context filtering remains mandatory.';
