# 10_PHASE_2_PERSISTENCE_FOUNDATION_PLAN

Version: 1.2
Status: Wave A applied — Waves B–G awaiting approval
Document Type: Data Model / Persistence Plan
Priority: Critical
Date: 2026-08-08

---

# Purpose

Transform the approved Phase 1 Community Communication Foundation domain model into a **production-ready persistence plan**.

**Wave A:** Applied on linked remote — [11_WAVE_A_MIGRATION_SQL_REVIEW.md](./11_WAVE_A_MIGRATION_SQL_REVIEW.md).  
**Wave B:** Design only — [12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md](./12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md).  
**STOP:** Do not create Wave B migrations or start Waves C–G until explicitly approved.

Related decision record: [ADR-041](../006_ARCHITECTURE_DECISIONS/ADR-041-PHASE-2-PERSISTENCE-FOUNDATION-PLAN.md).

---

# 1. Database audit report

## 1.1 Migration inventory (ordered)

| Migration | Purpose |
|-----------|---------|
| `20260806120000_foundation_placeholder.sql` | No-op placeholder |
| `20260806121000_foundation_identity_model.sql` | `tenants`, `territories`, `persons`, `identities`, `memberships` |
| `20260806130000_tenant_isolation_rls.sql` | Tenant context GUCs + RLS on identity tables |
| `20260806140000_database_grants.sql` | Grants to `authenticated` |
| `20260806150000_seed_life_panoramica.sql` | Seed tenant + territory |
| `20260806160000_create_community_areas.sql` | `community_areas` |
| `20260806170000_seed_life_panoramica_areas.sql` | Seed 7 areas (incl. Aldea Golf) |
| `20260806180000_community_area_rls.sql` | RLS for areas |
| `20260806190000_create_addresses.sql` | `addresses` + same-territory area trigger |
| `20260806200000_address_rls.sql` | RLS for addresses |
| `20260806210000_create_properties.sql` | `properties` |
| `20260806220000_property_rls.sql` | RLS for properties |
| `20260806230000_create_property_person_relationships.sql` | PPR table |
| `20260806240000_property_person_relationship_rls.sql` | RLS for PPR |
| `20260806250000_create_persons.sql` | ADR-010 person columns |

## 1.2 What already exists (reuse)

| Table | Role | RLS |
|-------|------|-----|
| `tenants` | Isolation / commercial root | Yes — current tenant |
| `territories` | Community environment | Yes — via tenant |
| `persons` | Human identity (no tenant_id) | Yes — via membership path |
| `identities` | Auth provider link | **No** (Security Platform) |
| `memberships` | Person ↔ Territory participation | Yes |
| `community_areas` | Micro Area organization | Yes |
| `addresses` | Physical location (+ optional `community_area_id`) | Yes |
| `properties` | Unit at address (no person FKs) | Yes |
| `property_person_relationships` | Time-aware Person ↔ Property roles | Yes |

**Isolation pattern (reuse):** bound `app.tenant_id` / `app.territory_id` → policies inherit Tenant via Territory (or Address → Territory → Tenant).

**Constraint style (reuse):** `text` + CHECK (no PostgreSQL ENUM types today). Prefer same style for new columns.

## 1.3 What can be extended

| Object | Extension needed |
|--------|------------------|
| `property_person_relationships.relationship_type` CHECK | Add `family_member`, `guest`, `staff` |
| `property_person_relationships.status` CHECK | Add `pending_verification`, `rejected`, `ended` |
| `property_person_relationships` columns | Add `verified_at`, `verification_id` (nullable FK) |
| `packages/database` schema/mappers | Add geography + PPR + new Phase 2 tables; sync Person columns |

## 1.4 What must not be duplicated

- Do not create a second Tenant / Territory / Person / Membership system  
- Do not put `owner_id` / `resident_id` on `properties`  
- Do not store area permission lists on `persons`  
- Do not create `ChatRoom` or `Activity` tables  
- Do not attach verification document blobs to `persons`

## 1.5 Seed gaps

Seeded today: 1 tenant, 1 territory, 7 community areas.  
**Not seeded:** addresses, properties, persons, memberships, PPRs, channels, resources, experiences.

Demo catalogs remain in `tenants/life-panoramica` until a later seed migration is approved.

## 1.6 Typed schema lag

`packages/database/src/schema.ts` covers only identity five tables; missing `community_areas`, `addresses`, `properties`, PPR; `persons` row type incomplete vs SQL ADR-010 columns.

---

# 2. Domain-to-persistence mapping

| Domain concept | Existing table | New table? | Tenant scope / ownership | RLS requirement |
|----------------|----------------|------------|--------------------------|-----------------|
| Territory | `territories` | No | `tenant_id` | Reuse |
| CommunityArea | `community_areas` | No | via `territory_id` | Reuse |
| Territory Authority | — | **Yes:** `official_entity_profiles` (or reuse planned Official Entity table) | Territory-scoped profile; kind includes `territory_authority` | via territory → tenant |
| Official Entity | — | Same `official_entity_profiles` | ADR-016 | via territory → tenant |
| Business Entity | — | **Yes:** `business_profiles` (can share wave or follow Official Entity) | ADR-016 | via territory → tenant |
| Channel | — | **Yes:** `channels` | `tenant_id` + `territory_id`; owner via `owner_kind` + `owner_id` | Territory membership + private residency gate |
| CommunityGroup | — | **Yes:** `community_groups` (+ optional `community_group_memberships`) | `tenant_id` + `territory_id` | via territory |
| Experience | — | **Yes:** `experiences` (+ later `experience_participations`) | `tenant_id` + `territory_id`; optional FKs to channel/group/area/resource | via territory; join rules app-level + RLS |
| LocalEntity | — | **Yes:** `local_entities` (or map to business_profiles + discovery view) | Territory / area facets | via territory |
| CommunityResource | — | **Yes:** `community_resources` | Ownership columns + `access_policy` jsonb | via territory; reserve eligibility app + RLS helpers |
| Person | `persons` | No (extend typing only) | No tenant_id | Reuse |
| Property | `properties` | No | via address | Reuse |
| PropertyPersonRelationship | `property_person_relationships` | **Alter** | via property path | Reuse + tighten for pending |
| ResidencyVerification | — | **Yes:** `residency_verifications` | territory + relationship | via territory; claimant / reviewers |
| ResidencyVerificationEvidence | — | **Yes:** `residency_verification_evidence` | via verification; `file_id` text/uuid to Files | via parent verification |

**LocalEntity note:** Prefer one `local_entities` table aligned with `packages/types` LocalEntity for Phase 2 discovery; Business Profile can be linked later without merging Person into business.

---

# 3. Channel persistence design (ADR-035)

## 3.1 Proposed table: `channels`

| Column | Type intent | Notes |
|--------|-------------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid NOT NULL FK → tenants | Denormalized for RLS simplicity |
| `territory_id` | uuid NOT NULL FK → territories | Must belong to tenant |
| `type` | text CHECK | `official\|community\|interest\|business\|service\|marketplace\|mobility` |
| `slug` | text NOT NULL | Unique per territory |
| `name` | text NOT NULL | Catalog/default; UI i18n later |
| `description` | text | |
| `community_area_id` | uuid NULL FK → community_areas | Optional; same territory |
| `owner_kind` | text CHECK | `official_entity\|group\|business_profile\|platform` |
| `owner_id` | uuid NOT NULL | Polymorphic owner (no cross-table FK) |
| `status` | text CHECK | `draft\|active\|archived` |
| `verification_level` | text NULL | optional |
| `requires_verified_residency` | boolean NOT NULL DEFAULT false | Private area channels |
| `created_at` / `updated_at` | timestamptz | |

**Constraints:** UNIQUE `(territory_id, slug)`; trigger/CHECK that `community_area_id` territory matches; app + DB validation of owner_kind vs type (ADR-035 compatibility matrix).

**Not a replacement for:** Group, Experience, LocalEntity, Resource.

## 3.2 RLS intent (channels)

- SELECT: active Membership in territory **AND** (NOT `requires_verified_residency` OR person has active verified PPR deriving that `community_area_id`).  
- INSERT/UPDATE/DELETE: RBAC-equivalent — initially Membership + elevated capability enforced in service layer; RLS may restrict writes to admin via helper later.  
- Fail closed without tenant context.

---

# 4. Resource access persistence (ADR-036)

## 4.1 Proposed table: `community_resources`

| Column | Type intent | Notes |
|--------|-------------|-------|
| `id` | uuid PK | |
| `tenant_id` / `territory_id` | uuid NOT NULL | |
| `name`, `description`, `image_url`, `location` | text | |
| `community_area_id` | uuid NULL | Home / location area |
| `type` | text CHECK | sports_facility, space, amenity, … |
| `owner_kind` | text CHECK | territory_authority, official_entity, community_area, business_profile |
| `owner_id` | uuid NOT NULL | |
| `managed_by_official_entity_id` | uuid NULL | |
| `bookable` | boolean | |
| `status` | text CHECK | draft, active, maintenance, retired |
| `access_policy` | jsonb NOT NULL | See schema below |
| `rules` | jsonb / text[] | |
| `slot_minutes`, `capacity` | int | Foundation for booking — **no booking engine** |
| timestamps | | |

### `access_policy` JSON shape (must match types)

```json
{
  "visibility": "territory|community_area|private|hidden",
  "reservationScope": "territory|community_area|group|permit_holders|guests_allowed|paid",
  "reservationCommunityAreaIds": ["uuid", "..."],
  "reservationGroupIds": ["uuid", "..."],
  "sharedAcrossAreas": false,
  "allowGuestReservation": false,
  "requiresPayment": false
}
```

**Visibility ≠ Reservation** (normative).

Example — Padel Court Aldea Golf:

- `visibility`: `territory` (discoverable)  
- `reservationScope`: `community_area`  
- `reservationCommunityAreaIds`: `[aldea-golf]`  

## 4.2 RLS intent (resources)

- SELECT: Membership in territory AND visibility allows (territory visibility ⇒ member can read row; private/hidden stricter).  
- Reserve is **not** a SQL verb — enforced in application using ADR-036 evaluator + later reservation table RLS.  
- INSERT/UPDATE territorial inventory: Authority / manage capability only (service + optional RLS helper).

---

# 5. Residency persistence (ADR-037 / ADR-038)

## 5.1 Alter: `property_person_relationships`

| Change | Detail |
|--------|--------|
| Expand `relationship_type` CHECK | + `family_member`, `guest`, `staff` |
| Expand `status` CHECK | + `pending_verification`, `rejected`, `ended` (keep `active`, `inactive`, `archived`) |
| Add `verified_at` | timestamptz NULL |
| Add `verification_id` | uuid NULL FK → `residency_verifications(id)` DEFERRABLE or set after verification insert |

**Derivation path (unchanged conceptually):**

```
Person → PPR (status = active + temporal) → Property → Address.community_area_id → CommunityArea
```

Never store durable area ACL on `persons`.

## 5.2 New: `residency_verifications`

| Column | Intent |
|--------|--------|
| `id` | uuid PK |
| `relationship_id` | FK → PPR |
| `person_id` | FK → persons (claimant) |
| `territory_id` | FK → territories |
| `community_area_id` | uuid NULL |
| `method` | CHECK: residency_certificate, owner_invitation, administration_approval, approved_documentation |
| `status` | CHECK: draft, submitted, under_review, approved, rejected, cancelled |
| `reviewed_by_person_id` | uuid NULL |
| `decision_note` | text NULL |
| `submitted_at`, `decided_at`, timestamps | |

## 5.3 New: `residency_verification_evidence`

| Column | Intent |
|--------|--------|
| `id` | uuid PK |
| `verification_id` | FK → residency_verifications ON DELETE CASCADE |
| `kind` | certificate_file, supporting_document_file, owner_invitation_reference, administration_decision_reference |
| `file_id` | uuid/text NULL — Core Files reference (**not** Person) |
| `external_reference` | text NULL |
| `metadata` | jsonb DEFAULT `{}` |
| `created_at` | |

**Forbidden:** document columns on `persons`.

## 5.4 Status semantics

| PPR status | Access contribution |
|------------|---------------------|
| `pending_verification` | **None** for restricted resources / private channels |
| `active` (+ dates) | Contributes CommunityArea if role eligible |
| `rejected` | None |
| `ended` / `inactive` / `archived` | None |

---

# 6. Enums and constraints (document only — do not apply yet)

Prefer **text + CHECK** (consistent with foundation). No new PostgreSQL ENUM types required unless team standard changes.

| Location | Values to allow |
|----------|-----------------|
| PPR `relationship_type` | existing + family_member, guest, staff |
| PPR `status` | existing + pending_verification, rejected, ended |
| Channel `type` | official, community, interest, business, service, marketplace, mobility |
| Channel `owner_kind` | official_entity, group, business_profile, platform |
| Channel `status` | draft, active, archived |
| Resource `owner_kind` | territory_authority, official_entity, community_area, business_profile |
| Resource `status` | draft, active, maintenance, retired |
| Verification `method` / `status` | per ADR-038 / types |
| Experience `type` / `status` | per ADR-027 / types (when `experiences` table lands) |

---

# 7. RLS security plan

## 7.1 Helper functions (proposed)

| Helper | Purpose |
|--------|---------|
| Reuse `app_has_tenant_context`, `app_current_tenant_id`, `app_person_in_current_tenant` | Existing |
| `app_person_verified_community_area_ids(person_id)` | Returns set of area ids from **active** PPRs + address.community_area_id |
| `app_can_access_private_channel(channel_id, person_id)` | NOT requires_verified_residency OR area ∈ verified set |
| `app_can_view_resource(resource_id, person_id)` | Visibility policy |
| (App-layer) `evaluateResourceAccess` | Reservation eligibility — keep authoritative in domain TS initially; optional SQL mirror later |

## 7.2 Scenario validation

| Actor | Aldea Golf private channel | Aldea Golf area-scoped reserve | Zona Verde private / reserve | Public territory info |
|-------|----------------------------|--------------------------------|------------------------------|------------------------|
| Verified Aldea resident | Allow | Allow (if RBAC reserve) | Deny private/reserve | Allow |
| Pending Aldea claim | Deny | Deny | Deny | Allow |
| Verified Zona Verde resident | Deny | Deny reserve (may view if visibility territory) | Allow | Allow |

## 7.3 FORCE ROW LEVEL SECURITY

All new tenant-scoped tables: `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY` (match foundation).

---

# 8. Migration proposal (ordered waves — not executed)

## Wave A — PPR alignment (low risk, unblocks verification)

**Status:** **Applied** on linked remote (`20260808100000`) — [review](./11_WAVE_A_MIGRATION_SQL_REVIEW.md)

1. ALTER PPR CHECKs for types + statuses  
2. ADD COLUMN `verified_at`, `verification_id` (nullable)  
3. Create `residency_verifications`, `residency_verification_evidence` + RLS  
4. Helper `app_person_verified_community_area_ids` (ADR-037)  
5. Backfill: none (no production PPR rows seeded)  
6. Artifacts: `20260808100000_wave_a_ppr_residency_verification.sql` + paired `.down.sql`

## Wave B — Official / Business profiles (Authority ownership)

**Status:** **Applied** on linked remote (`20260808110000`–`20260808130000`) — [review](./13_WAVE_B_MIGRATION_SQL_REVIEW.md)

1. `official_entity_profiles` (Territory Authority = `kind = territory_authority`)  
2. **`business_profiles` deferred** (not Wave B)  
3. Seed Panoramica Administration + Municipality (deterministic `…021` / `…022`)  
4. RLS via `tenant_id`; no Channels / Person ACL  

## Wave C — Channels + Groups

1. `channels` + RLS + indexes `(territory_id, slug)`  
2. `community_groups` (+ `community_group_memberships` if needed for Phase 2)  
3. FK-friendly: channels.owner_id remains polymorphic

## Wave D — Resources (+ access_policy)

1. `community_resources` with `access_policy` jsonb + CHECK owner_kind  
2. RLS SELECT by visibility; writes restricted  

## Wave E — Experiences (+ participations optional)

1. `experiences` with optional FKs: `channel_id`, `group_id`, `community_area_id`, `resource_id`  
2. Optional `experience_participations`  
3. **No** booking/reservation engine tables beyond existing future ADR-031 path  

## Wave F — Local entities (discovery)

1. `local_entities` aligned with types  
2. Optional link to business_profiles / channels  

## Wave G — Typed package sync

1. Update `packages/database` schema + mappers for all SQL tables  
2. Sync Person row type with ADR-010 columns  

**Recommended first approval slice:** Wave A only (residency verification persistence). Then B→C→D→E.

---

# 9. Deliverable summary tables

## 9.1 Tables affected (ALTER)

| Table | Changes |
|-------|---------|
| `property_person_relationships` | CHECK expansions; `verified_at`; `verification_id` |

## 9.2 New tables required

| Table | Wave |
|-------|------|
| `residency_verifications` | A |
| `residency_verification_evidence` | A |
| `official_entity_profiles` | B |
| `business_profiles` | B (optional same wave) |
| `channels` | C |
| `community_groups` | C |
| `community_group_memberships` | C (recommended) |
| `community_resources` | D |
| `experiences` | E |
| `experience_participations` | E (optional) |
| `local_entities` | F |

## 9.3 Altered tables required

- `property_person_relationships` (Wave A)  
- Possibly `persons` — **no** doc columns; typing only in package  

## 9.4 Enum / CHECK changes

Documented in §6 — implement as DROP CONSTRAINT / ADD CONSTRAINT in Wave A+C+D.

## 9.5 RLS changes

- New policies on every new table  
- New SQL helpers for verified community areas + private channel access  
- No weakening of fail-closed tenant context  

---

# 10. Data migration risks

| Risk | Mitigation |
|------|------------|
| Expanding CHECK rejects existing rows | Audit distinct values before ALTER; foundation seed has **zero** PPR rows — low risk |
| Polymorphic `owner_id` orphans | App validators (ADR-035); optional soft consistency jobs |
| `access_policy` jsonb drift from TS | Shared schema tests; version field later if needed |
| Private channel RLS false positives | Helper must require `status = active` and date bounds |
| Dual write (demo catalogs vs DB) | Keep tenant catalogs until cutover; feature flag read path |
| Person document leakage | Evidence table only; code review forbid Person blob columns |
| Typed client out of sync | Wave G mandatory before app switch to DB reads |

---

# 11. Rollback strategy

| Wave | Rollback |
|------|----------|
| A | DROP new verification tables; DROP new columns; restore prior CHECK constraints from migration down file |
| B–F | DROP new tables (CASCADE carefully); no changes to identity foundation |
| RLS helpers | DROP FUNCTION after dependent policies dropped |
| Seeds | Delete by deterministic UUIDs |

**Rules:**

1. Every forward migration ships a paired down migration or documented reverse steps.  
2. Never DROP `tenants` / `territories` / `persons` / `memberships` in Phase 2.  
3. Prefer expand-only CHECKs; narrowing requires data cleanup first.  
4. Feature flags keep UI on in-memory catalogs until DB read path validated.

---

# STOP

## Approval gate

| Gate | Status |
|------|--------|
| Wave A prepare SQL | **Done** — see [11_WAVE_A_MIGRATION_SQL_REVIEW.md](./11_WAVE_A_MIGRATION_SQL_REVIEW.md) |
| Wave A **apply** to database | **Done** (`20260808100000` on linked remote) |
| Wave B design | **Done** — [12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md](./12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md) |
| Wave B DDL prepare | **Done** — [13_WAVE_B_MIGRATION_SQL_REVIEW.md](./13_WAVE_B_MIGRATION_SQL_REVIEW.md) |
| Wave B **apply** | **Done** (`20260808110000`–`130000` on linked remote) |
| Wave G typed package sync | **Pending** — `packages/database` still identity-only |
| Waves C–F | Not approved |

**Do not start Waves C–F until explicitly approved.**

---

# References

- ADR-003 Database Security RLS Model  
- ADR-035–ADR-041  
- `supabase/migrations/*`  
- `packages/types/src/domain/*`  
- `docs/018_ROADMAP/16_PHASE_1_COMMUNITY_COMMUNICATION_COMPLETION.md`  
- [11_WAVE_A_MIGRATION_SQL_REVIEW.md](./11_WAVE_A_MIGRATION_SQL_REVIEW.md)
