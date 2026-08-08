# 13_WAVE_B_MIGRATION_SQL_REVIEW

Version: 1.1  
Status: **Applied** (linked remote `Life Community OS`)  
Date: 2026-08-08  
Document Type: Migration SQL Review / Approval Gate  

---

# Purpose

Human review package for **Wave B DDL** (Official Entity Profiles + demo seed).

Applied via `supabase db push --linked` (2026-08-08): `20260808110000`, `20260808120000`, `20260808130000`.

---

# Approved decisions (locked)

| # | Decision |
|---|----------|
| 1 | **`business_profiles` deferred** — not in Wave B DDL |
| 2 | Clubs/associations: private → Business Profile and/or Group later; public institutional → Official Entity. Do not expand Official Entity to commercial entities |
| 3 | Kind CHECK v1: `territory_authority`, `municipality`, `public_service`, `other_official` |
| 4 | Demo seeds use **deterministic UUIDs only**; production entities created normally |

Design: [12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md](./12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md) · ADR: [ADR-042](../006_ARCHITECTURE_DECISIONS/ADR-042-WAVE-B-TERRITORY-AUTHORITY-PERSISTENCE-DESIGN.md)

---

# Migration SQL (forward)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260808110000_create_official_entity_profiles.sql` | Table, constraints, indexes, triggers, `app_territory_authority_id` |
| `supabase/migrations/20260808120000_official_entity_profile_rls.sql` | ENABLE+FORCE RLS, policies, GRANT |
| `supabase/migrations/20260808130000_seed_life_panoramica_official_entities.sql` | Demo Administration + Municipality |

---

# Affected tables

| Object | Change |
|--------|--------|
| `official_entity_profiles` | **CREATE** |
| `tenants` / `territories` / `community_areas` | Referenced only (FK) |
| Wave A residency tables | **Unchanged** |
| `business_profiles` / `channels` / Groups / Resources / LocalEntity | **Not created** |

---

# Constraints

| Constraint | Rule |
|------------|------|
| PK | `id` uuid |
| FK | `tenant_id` → tenants; `territory_id` → territories; `primary_community_area_id` → community_areas (nullable) |
| UNIQUE | `(territory_id, slug)` |
| CHECK kind | `territory_authority` \| `municipality` \| `public_service` \| `other_official` |
| CHECK status | `draft` \| `pending_verification` \| `verified` \| `suspended` \| `archived` |
| CHECK verification_level | null or types VerificationLevel set |
| CHECK slug | kebab-case |
| Trigger | `tenant_id` = territory’s tenant |
| Trigger | area same territory when set |
| Partial UNIQUE index | one non-archived `territory_authority` per territory |

---

# Indexes

- `official_entity_profiles_one_authority_per_territory_idx` (partial unique)  
- `official_entity_profiles_tenant_id_idx`  
- `official_entity_profiles_territory_id_idx`  
- `official_entity_profiles_kind_idx`  
- `official_entity_profiles_status_idx`  
- `official_entity_profiles_primary_community_area_id_idx` (partial)

---

# RLS policies

| Policy | Command | Rule |
|--------|---------|------|
| `…_select_via_tenant` | SELECT | context + `tenant_id = app_current_tenant_id()` |
| `…_insert_via_tenant` | INSERT | context + tenant match + territory belongs to tenant |
| `…_update_via_tenant` | UPDATE | using/check tenant match + territory belongs |
| `…_delete_via_tenant` | DELETE | context + tenant match |

FORCE RLS on. GRANT to `authenticated`.  
Create/publish AuthZ remains application RBAC (residents must not create Official Entities via product rules).

Helper: `app_territory_authority_id(territory_id)` → verified Authority id or null (not a residency bypass).

---

# Demo seed UUIDs

| Entity | UUID | kind |
|--------|------|------|
| Panoramica Golf Administration | `10000000-0000-4000-8000-000000000021` | `territory_authority` |
| Municipality (demo) | `10000000-0000-4000-8000-000000000022` | `municipality` |

Metadata stores `demo_catalog_id` for later catalog cutover.  
Production rows: normal insert (random UUID / app-generated) — not these seed ids.

---

# Rollback plan

| Step | Script |
|------|--------|
| 1. Delete demo seeds | `down/20260808130000_seed_life_panoramica_official_entities.down.sql` |
| 2. Drop RLS + helper + table | `down/20260808110000_create_official_entity_profiles.down.sql` |

Order matters. Supabase does not auto-run `down/`.  
Never drop identity / geography / Wave A tables.

---

# Out of scope (confirmed)

- `business_profiles`  
- Channels / Groups / Resources / Experiences / LocalEntity  
- Commercial clubs as Official Entity  
- Application / UI / `packages/database` sync (follow-up after apply)

---

# Apply command (after approval only)

```bash
# DO NOT RUN until apply approved
npx supabase db push --linked --yes
```

---

# STOP

Wave B is **applied and verified**. Next gates: Wave G typed sync (optional) · Waves C–F await approval.

Do not create Channels / Groups / Resources / LocalEntity / business_profiles until those waves are approved.
