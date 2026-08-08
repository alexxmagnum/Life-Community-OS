# 12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN

Version: 1.1  
Status: **DDL prepared — awaiting apply approval (no migrations executed)**  
Date: 2026-08-08  
Document Type: Data Model / Persistence Design  
Priority: Critical  

Related:

- [ADR-042](../006_ARCHITECTURE_DECISIONS/ADR-042-WAVE-B-TERRITORY-AUTHORITY-PERSISTENCE-DESIGN.md)  
- [13_WAVE_B_MIGRATION_SQL_REVIEW.md](./13_WAVE_B_MIGRATION_SQL_REVIEW.md)  
- [ADR-016](../006_ARCHITECTURE_DECISIONS/ADR-016-OFFICIAL-ENTITIES-BUSINESS-PROFILES-MODEL.md)  
- [ADR-034](../006_ARCHITECTURE_DECISIONS/ADR-034-COMMUNITY-GOVERNANCE-ADMINISTRATION-MODEL.md)  
- [ADR-035](../006_ARCHITECTURE_DECISIONS/ADR-035-COMMUNITY-CHANNELS-MODEL.md)  
- [ADR-040](../006_ARCHITECTURE_DECISIONS/ADR-040-PHASE-1D-PERMISSION-MATRIX.md)  
- [ADR-041](../006_ARCHITECTURE_DECISIONS/ADR-041-PHASE-2-PERSISTENCE-FOUNDATION-PLAN.md)  
- [10_PHASE_2_PERSISTENCE_FOUNDATION_PLAN](./10_PHASE_2_PERSISTENCE_FOUNDATION_PLAN.md)  
- Wave A applied: `20260808100000_wave_a_ppr_residency_verification.sql`

---

# Purpose

Design the **Wave B persistence foundation** for Territory Authority and Official Entity Profiles — the governance layer required for future official channels, municipality communication, administration announcements, and controlled publishing.

**Approved decisions locked** (see §0). SQL prepared for review — [13_WAVE_B_MIGRATION_SQL_REVIEW.md](./13_WAVE_B_MIGRATION_SQL_REVIEW.md).

**STOP:** Do not apply migrations until Wave B SQL review is explicitly approved.

Wave A remains complete. Do not revisit Wave A unless a dependency issue is discovered.

---

# 0. Approved decisions (pre-DDL)

| # | Decision | Wave B impact |
|---|----------|---------------|
| 1 | **`business_profiles` deferred** | Not in Wave B DDL; commercial → future Business Profile / LocalEntity |
| 2 | Club / association mapping | Private clubs → Business Profile and/or Group; public institutional orgs → Official Entity. Do **not** expand Official Entity to commercial entities |
| 3 | Official Entity kinds v1 | `territory_authority`, `municipality`, `public_service`, `other_official` |
| 4 | Seed strategy | Deterministic UUIDs **only** for demo seeds; production entities created normally |

---

# 1. Audit report

## 1.1 What exists (reuse)

| Layer | Artifact | Role for Wave B |
|-------|----------|-----------------|
| Isolation root | `tenants` | SaaS Tenant; security boundary |
| Community environment | `territories` (`tenant_id`) | Scope for Official Entity profiles |
| Participation | `memberships` | Belonging only — **not** Authority |
| Identity | `persons` (no `tenant_id`) | Representatives via RBAC later — **not** the institution |
| Org geography | `community_areas` | Optional coverage / future channel area scope — **not** isolation |
| Residency spine (Wave A) | PPR + `residency_verifications` + helper | Authority **reviews** claims; does not replace residency derivation |
| RLS helpers | `app_current_tenant_id`, `app_has_tenant_context`, … | Fail-closed Tenant Context (ADR-003) |
| Domain ADRs | 012, 016, 034, 035, 040 | Normative behaviour |
| Demo catalog | `tenants/life-panoramica/src/official-entities.ts` | Field shape preview (in-memory only) |

### Tenant ownership / RLS pattern (normative reuse)

```
bound app.tenant_id
  → territories.tenant_id
    → community_areas / profiles scoped by territory_id
```

Persons visible via Membership → Territory → Tenant.  
No area permission lists on `persons`.

## 1.2 What is missing (Wave B creates)

| Structure | Status |
|-----------|--------|
| `official_entity_profiles` table | **Missing** — required |
| `business_profiles` table | **Missing** — optional same wave (recommended for Channel `ownerKind` foresight) |
| Official Entity lifecycle CHECKs in SQL | Missing |
| Seed rows for Panoramica Administration + Municipality | Missing (SQL); present in demo catalog with string IDs |
| First-class `OfficialEntityProfile` / `BusinessProfile` in `packages/types` | Missing (demo-only types today) |
| Role Assignment persistence for “represents Official Entity” | Missing — **out of Wave B DDL**; remains Platform RBAC (ADR-012) |

## 1.3 Organization models today

| Concept | Persistence | Notes |
|---------|-------------|-------|
| Membership | SQL | Participation; never Official Entity |
| CommunityArea | SQL | Organizational subdivision |
| Official Entity | Demo TS only | Territory Authority = `kind: territory_authority` |
| Business Profile | ADR + Channel/Resource owner kinds only | No table / shared type yet |
| LocalEntity | Types only | Discovery UX — **Wave F**; not Official Entity |
| Channel | Types + demo | **Wave C** |

## 1.4 RBAC / permissions today

- Normative: Platform RBAC (ADR-012 / ADR-034 / ADR-040).  
- Demo capabilities: `tenants/life-panoramica/src/capabilities.ts` (in-memory).  
- **No** parallel Community ACL.  
- **No** SQL role_assignment tables in Wave B scope.

## 1.5 Conflicts / tensions to resolve in design (not by inventing new systems)

| Tension | Resolution in Wave B design |
|---------|------------------------------|
| Territory Authority vs Official Entity | **One table**; Authority is a **kind / product alias**, not a second aggregate |
| Channel `ownerKind: official_entity` vs Resource `ownerKind: territory_authority` | Both may point at the **same** Official Entity row; document polymorphic semantics |
| Demo string IDs (`oe-panoramica-admin`) vs UUID SQL | Future seed uses deterministic UUIDs; demo cutover later |
| Lifecycle (`draft`…`verified`) vs `VerificationLevel` | Persist ADR-016 **status**; map trust signals to `verification_level` column or derive |
| Representatives | RBAC assignments (future) — **do not** encode Authority as Membership type |
| Residents creating officials | Forbidden by product + AuthZ; RLS alone is tenant-scoped (AuthZ enforces create) |

## 1.6 Explicit non-goals (audit boundary)

- No Channels / Groups / Resources / Experiences / LocalEntity DDL  
- No ChatRoom / Activity aggregates  
- No Person area ACL columns  
- No Wave A changes  
- No application or UI changes in this phase  

---

# 2. Domain mapping

| Domain concept | Persistence target | Tenant / Territory | Notes |
|----------------|-------------------|--------------------|-------|
| Territory | `territories` (exists) | `tenant_id` | Unchanged |
| CommunityArea | `community_areas` (exists) | via `territory_id` | Optional coverage FK from profiles later |
| Person | `persons` (exists) | via Membership | Never the Official Entity |
| Membership | `memberships` (exists) | via Territory | Not Authority |
| **Territory Authority** | Row in `official_entity_profiles` with `kind = territory_authority` | `tenant_id` + `territory_id` | Product alias (ADR-040) |
| **Official Entity Profile** | `official_entity_profiles` | `tenant_id` + `territory_id` | ADR-016 |
| Business Entity / Profile | `business_profiles` (optional Wave B) | `tenant_id` + `territory_id` | ADR-016; Channel/Resource owner foresight |
| Official Channel (future) | `channels` (Wave C) | `owner_kind = official_entity`, `owner_id` → profile | ADR-035 |
| LocalEntity | Wave F | May **link** to profiles later | Must not replace Official Entity |

```
Tenant
  └── Territory
        ├── CommunityArea (org)
        ├── Membership → Person (participation)
        ├── Official Entity Profile  ←── Territory Authority (kind)
        │     └── (Wave C) owns Official Channel via owner_id
        └── Business Profile (optional)
```

---

# 3. Authority model proposal

## 3.1 Definition

**Territory Authority** is the Official Entity Profile that governs territorial official communication, stewardship of territorial resources (policy + RBAC), and participation in residency verification review for a Territory.

It is **not**:

- a Membership type  
- a Person flag  
- a parallel AuthZ system  
- a chat operator identity  

## 3.2 Persistence rule

```
Territory Authority  ≡  official_entity_profiles
                        WHERE kind = 'territory_authority'
                        AND territory_id = <territory>
                        AND status = 'verified'   -- for privileged official behaviour
```

**Cardinality (recommended default):** at most **one** `territory_authority` row per Territory (UNIQUE partial index). Other Official Entities (municipality, public_service, …) may coexist.

## 3.3 Ownership & governance

| Concern | Owner |
|---------|-------|
| Security boundary | Tenant |
| Organizational scope | Territory (required) |
| Community Area | Optional coverage / communication scope — not isolation |
| Who may act as Authority operators | Platform RBAC assignments scoped to the Official Entity (ADR-012/034/040) — **not** stored as area ACL on Person |
| Who creates the Authority profile | Tenant owner / platform-controlled bootstrap (not residents) |

## 3.4 Examples (Life Panoramica)

| Profile | Kind | Role |
|---------|------|------|
| Panoramica Golf Administration | `territory_authority` | Territory Authority — official channels, territorial resources, residency review |
| Municipality (demo) | `municipality` | Official Entity — public notices; **cannot** impersonate Territory Authority |
| Sports Club (future) | Prefer **Business Profile** or Group stewardship — not Official Entity unless truly institutional |
| Local official service (e.g. police) | `public_service` | Official Entity — verified institutional presence |

## 3.5 Relationship to residency (Wave A)

- Authority operators with RBAC may **review** `residency_verifications` (ADR-040: Verify residents = A+R).  
- Authority **cannot** bypass ADR-037/038: private resident surfaces still require verified residency (or explicit AuthZ override paths already named in ADR-040 — not Person ACL).  
- Authority does **not** grant itself residency by existing; no automatic PPR.

---

# 4. Official Entity model proposal

## 4.1 Aggregate: Official Entity Profile

Verified institutional representation (ADR-016).

### Proposed table: `official_entity_profiles`

| Column | Type intent | Notes |
|--------|-------------|-------|
| `id` | uuid PK | Deterministic UUIDs for seeds |
| `tenant_id` | uuid NOT NULL FK → tenants | Denormalized for RLS simplicity (must match territory’s tenant) |
| `territory_id` | uuid NOT NULL FK → territories | Required scope |
| `kind` | text CHECK | `territory_authority` \| `municipality` \| `public_service` \| `other_official` (extensible via migration later) |
| `slug` | text NOT NULL | Unique per territory |
| `name` | text NOT NULL | Catalog/default; UI i18n later |
| `description` | text | |
| `status` | text CHECK | ADR-016: `draft` \| `pending_verification` \| `verified` \| `suspended` \| `archived` |
| `verification_level` | text NULL | Align with types `VerificationLevel` when trusted |
| `image_url` | text NULL | |
| `primary_community_area_id` | uuid NULL FK → community_areas | Optional home area; same territory trigger |
| `metadata` | jsonb DEFAULT `{}` | Non-identity attributes |
| `created_at` / `updated_at` | timestamptz | |

### Required constraints

1. UNIQUE `(territory_id, slug)`  
2. Trigger/CHECK: `territory.tenant_id = tenant_id`  
3. Trigger: `primary_community_area_id` same territory when set  
4. UNIQUE partial: one `kind = territory_authority` per `territory_id` where status not `archived` (recommended)  
5. Privileged official behaviour (product): require `status = verified` — enforce in AuthZ/app; optional DB CHECK for publishing tables later (Wave C)

### Forbidden

- Document vault columns on `persons`  
- `owner_person_id` as security boundary  
- Membership type = `territory_authority`  

## 4.2 Business Profiles — **deferred (not Wave B)**

`business_profiles` is **out of Wave B DDL** (approved decision). Commercial entities, private clubs, and associations default to future Business Profile and/or Group work — not Official Entity expansion.

---

## 4.3 Official Entity capabilities (product)

| Can | Cannot |
|-----|--------|
| Publish verified information when `verified` + RBAC | Impersonate Territory Authority (wrong kind / wrong assignment) |
| Manage own Official Entity presence (RBAC on that entity) | Bypass residency for private residential surfaces |
| Own future Official Channels (`owner_kind = official_entity`) | Be created by ordinary residents as self-serve verified official |
| Participate in stewardship per ADR-040 | Replace Membership or Tenant |

## 4.4 Promote to `packages/types` (documentation only — later change)

When DDL is approved, promote demo `OfficialEntityProfile` into `@life-community-os/types` with:

- `kind`, `status` (ADR-016), optional `verificationLevel`  
- Align Resource `ownerKind: territory_authority` → resolve to Official Entity id with `kind = territory_authority`

---

# 5. Permission matrix (Wave B persistence view)

Normative matrix remains **ADR-040**. Wave B persistence implications:

## 5.1 Actors ↔ storage

| ADR-040 actor | Persistence meaning |
|---------------|---------------------|
| `territory_authority` | Operators of Official Entity where `kind = territory_authority` + RBAC |
| `official_entity` | Operators of other Official Entity profiles + RBAC |
| `business_entity` | Operators of Business Profile + RBAC |
| `community_admin` | RBAC package — **not** an Official Entity row |
| Residency roles | PPR (Wave A) — unchanged |
| Resident Person | Membership + Person — **cannot** create Official Entities |

## 5.2 Actions (persistence-facing)

| Action | Territory Authority | Official Entity | Residents | Persistence note |
|--------|--------------------|-----------------|-----------|------------------|
| Create Official Entity | Tenant bootstrap / A+R | N (self) | **N** | AuthZ; not Membership |
| Publish official information | A+R | A+R (own entity; not Authority impersonation) | **N** | Needs verified status; Channel content Wave C+ |
| Manage official channels (future) | A+R | A+R (own `owner_id`) | **N** | Wave C `channels.owner_*` |
| Manage territorial resources (future) | A+R | A+R per policy | **N** as owner | Wave D; `owner_kind` may be `territory_authority` |
| Verify residents | A+R | A+R (when assigned) | invite path only | Wave A tables; no Person ACL |
| Bypass residency rules | **N** | **N** | N/A | ADR-037/038 intact |
| Access private resident data | Only with explicit Permission | Same | Own data only | No Wave B table grants this |

## 5.3 Evaluation order (unchanged)

```
Tenant → Membership → RBAC → Channel/Resource policy
  → verified residency (when required) → ownership/stewardship
```

Wave B adds **stewardship targets** (profile rows), not a new AuthZ engine.

---

# 6. Official Channel foundation (compatibility only — no Channels DDL)

## 6.1 ADR-035 boundaries (preserve)

Channel is an **organization layer**, not chat, not Tenant, not Group/Experience/Resource replacement.

Official channels:

- `type = official`  
- `owner_kind = official_entity` **only**  
- `owner_id` = `official_entity_profiles.id`  

Territory Authority channels use the Authority profile id (same table).

## 6.2 Future ownership link (Wave C)

```
official_entity_profiles.id
        │
        ▼
channels.owner_kind = 'official_entity'
channels.owner_id   = <official_entity_profiles.id>
channels.territory_id must match profile.territory_id
channels.tenant_id    must match profile.tenant_id
```

**No separate communication architecture.** No `authority_channels` table. No ChatRoom.

## 6.3 Wave B readiness checklist for Wave C

| Prerequisite | Wave B delivers |
|--------------|-----------------|
| Stable Official Entity UUID | Yes (table + seed) |
| Territory Authority resolvable | `kind = territory_authority` |
| Verified-only official publish | `status` on profile |
| Polymorphic owner target exists | Yes — Channel FK soft/polymorphic as already planned |
| Business cannot own official | Enforced in Channel validators (types already) + Wave C CHECKs |

## 6.4 Publishing model foresight

- Attribution: Official Entity Profile (not Person as the institution).  
- Author Person remains audit actor (ADR-021 / ADR-026).  
- Content tables are **out of Wave B**.

---

# 7. RLS strategy

## 7.1 Principles

1. Fail closed without `app_has_tenant_context()`.  
2. Isolation via `tenant_id = app_current_tenant_id()` (denormalized) **and** territory belonging to that tenant.  
3. FORCE ROW LEVEL SECURITY on all new tables.  
4. GRANT to `authenticated`; AuthZ for create/update official remains application + future RBAC.  
5. Do not encode Authority privileges solely in RLS (would invent parallel AuthZ).

## 7.2 Proposed policies — `official_entity_profiles`

| Command | Using / with check |
|---------|-------------------|
| SELECT | Tenant context + `tenant_id = app_current_tenant_id()` (optional: hide `draft` from non-managers in **app** layer first) |
| INSERT | Tenant context + tenant match + territory belongs to tenant (**AuthZ** must still block residents) |
| UPDATE / DELETE | Same tenant match |

Optional later (not required for Wave B MVP RLS): tighter SELECT for non-verified profiles via `app_person_…` helpers once Role Assignments persist.

## 7.3 Proposed policies — `business_profiles` (if included)

Same Territory → Tenant pattern as Official Entity profiles.

## 7.4 Authority permissions vs RLS

| Concern | Layer |
|---------|-------|
| Cross-tenant leak | RLS (mandatory) |
| Resident creates Official Entity | AuthZ deny (ADR-040); RLS does not grant create by Membership |
| Publish official | AuthZ + verified status; Channel policies in Wave C |
| Impersonate Authority | AuthZ assignment to specific `owner_id` / kind checks |
| Private resident data | Existing Person/PPR/verification policies + AuthZ — Wave B adds **no** bypass |

## 7.5 Expected helper (optional Wave B)

```
app_territory_authority_id(p_territory_id uuid) → uuid
  -- returns verified territory_authority profile id or null
```

Useful for Wave C/D stewardship checks; **not** a residency bypass.

---

# 8. Migration proposal (ordered — **not executed**)

## Wave B1 — Official Entity Profiles (required) — **SQL prepared**

Artifacts (not applied):

- `20260808110000_create_official_entity_profiles.sql`  
- `20260808120000_official_entity_profile_rls.sql`  
- `20260808130000_seed_life_panoramica_official_entities.sql`  
- Review: [13_WAVE_B_MIGRATION_SQL_REVIEW.md](./13_WAVE_B_MIGRATION_SQL_REVIEW.md)

1. CREATE `official_entity_profiles` + constraints + same-territory triggers  
2. ENABLE + FORCE RLS + policies + GRANTs  
3. Helper `app_territory_authority_id`  
4. Demo seed: Panoramica Administration + Municipality (deterministic UUIDs `…021` / `…022`)

## Wave B2 — Business Profiles — **deferred**

Not in Wave B. Future Business Profile / LocalEntity work.

## Explicitly deferred

| Item | Wave |
|------|------|
| `business_profiles` | Future (not B) |
| `channels` + official ownership FK semantics | C |
| Role assignment / Official Entity operator tables | Security Platform / later AuthZ persistence |
| `packages/types` + `packages/database` sync | After DDL apply (Wave G slice) |
| LocalEntity | F |

---

# 9. Risks and rollback

| Risk | Mitigation |
|------|------------|
| Second “authority” table beside Official Entity | Forbidden — single `official_entity_profiles` |
| Encoding Authority as Membership | Rejected by ADR-011/016/040 |
| Residents creating verified officials via open INSERT RLS | AuthZ gate; consider service-role-only insert for bootstrap; audit |
| Demo string ID vs UUID seed mismatch | Deterministic UUID seed + documented demo cutover |
| Resource `territory_authority` vs Channel `official_entity` confusion | Document polymorphic resolution in ADR-042 / this design |
| Premature Channel DDL | Hard stop — Wave C only |
| Weakening residency via Authority RLS | No Wave B policy grants private area access |
| Typed client lag | Do not switch app reads until Wave G slice |

### Rollback

1. DROP seed rows by deterministic UUID.  
2. DROP policies → helpers → tables (`business_profiles` then `official_entity_profiles`).  
3. Never DROP `tenants` / `territories` / Wave A residency objects.  
4. Wave C+ must not exist yet, or drop dependent Channels first.

---

# 10. Deliverable checklist

| # | Deliverable | Section |
|---|-------------|---------|
| 1 | Audit report | §1 |
| 2 | Domain mapping | §2 |
| 3 | Authority model proposal | §3 |
| 4 | Official Entity model proposal | §4 |
| 5 | Permission matrix | §5 (+ ADR-040) |
| 6 | RLS strategy | §7 |
| 7 | Migration proposal | §8 |
| 8 | Risks and rollback | §9 |
| — | Official Channel foundation (compat) | §6 |

---

# STOP

**Decisions approved. DDL prepared. No migrations applied.**

Await explicit approval to **apply Wave B** ([13_WAVE_B_MIGRATION_SQL_REVIEW.md](./13_WAVE_B_MIGRATION_SQL_REVIEW.md)).
