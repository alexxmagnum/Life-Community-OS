# 11_WAVE_A_MIGRATION_SQL_REVIEW

Version: 1.1  
Status: **Applied** (linked remote `Life Community OS`)  
Date: 2026-08-08  
Document Type: Migration SQL Review / Approval Gate

---

# Purpose

Human review package for **Wave A only** (residency + PropertyPersonRelationship persistence).

Applied via `supabase db push --linked` after prechecks (2026-08-08).

---

# Approval context

| Item | Status |
|------|--------|
| Phase 2 plan (full) | Documented in `10_PHASE_2_PERSISTENCE_FOUNDATION_PLAN.md` |
| Wave A scope approval | **Approved** |
| Apply Wave A to database | **Applied** — migration `20260808100000` on remote |

---

# Files

| File | Role |
|------|------|
| `supabase/migrations/20260808100000_wave_a_ppr_residency_verification.sql` | Forward migration |
| `supabase/migrations/down/20260808100000_wave_a_ppr_residency_verification.down.sql` | Manual rollback |

---

# Scope checklist

| In scope | Out of scope (unchanged) |
|----------|---------------------------|
| PPR `relationship_type` / `status` CHECK expansion | Channels |
| PPR `verified_at`, `verification_id` | Groups |
| `residency_verifications` | Resources / Experiences |
| `residency_verification_evidence` | Local / Official Entities |
| Constraints + consistency triggers | Area ACL columns on `persons` |
| RLS + grants on new tables | Seed / demo rows |
| `app_person_verified_community_area_ids` helper | Core Files table FK |
| | `packages/database` typed sync (Wave G) |

Architecture preserved:

- ADR-037: eligibility derived `Person → PPR (active) → Property → Address.community_area_id`  
- ADR-038: claim = `pending_verification`; evidence not on Person; Files soft-ref via `file_id`

---

# Forward change summary

1. **ALTER** `property_person_relationships`  
   - Types: + `family_member`, `guest`, `staff`  
   - Status: + `pending_verification`, `rejected`, `ended`  
   - Columns: `verified_at`, `verification_id` (FK deferrable → `residency_verifications`)  
   - Default `status` remains `active` (claims must set `pending_verification` explicitly)

2. **CREATE** `residency_verifications`  
   - FKs: relationship, person, territory, optional community_area, optional reviewer  
   - CHECKs: method / status / decided_at when approved|rejected  
   - Triggers: person matches relationship; area same territory

3. **CREATE** `residency_verification_evidence`  
   - CASCADE delete from verification  
   - Soft `file_id` (no Files FK yet)  
   - Locator required (`file_id` XOR/`OR` non-empty `external_reference`)  
   - Metadata guardrail against Person document blob keys

4. **CREATE** `app_person_verified_community_area_ids(person_id)`  
   - Active + default eligibility roles + date bounds only  
   - No Person area lists

5. **RLS** ENABLE + FORCE on both new tables; policies via `territory_id → tenant`; GRANT to `authenticated`  
   - Existing PPR RLS policies **unchanged** (tenant via Property path)

---

# Risks

| Risk | Mitigation |
|------|------------|
| Expanding CHECK fails on bad existing values | Foundation has **zero** seeded PPR rows — audit `distinct` before apply if any manual data exists |
| Circular FK PPR ↔ verification | `verification_id` nullable + `DEFERRABLE INITIALLY DEFERRED` |
| Soft `file_id` orphans | Acceptable until Core Files lands; app validators for file methods |
| Tenant-wide RLS (not claimant-only) | Matches foundation pattern; AuthZ remains application-layer |
| Restoring narrow CHECKs on rollback | Down script documents mandatory distinct-value precheck |

---

# Rollback considerations

1. Run down script **only** if Wave A must be undone and no later waves depend on it.  
2. Drop order: policies → helper → triggers → PPR columns/FK → evidence → verifications → restore CHECKs.  
3. Before restoring old CHECKs, remapping/delete rows that use new type/status values.  
4. Never drop identity / geography foundation tables.  
5. Supabase does not auto-run `down/`; rollback is **manual**.

---

# Apply command (after approval only)

```bash
# From repo root — DO NOT RUN until apply approved
pnpm exec supabase db push
# or project-equivalent migration apply
```

---

# STOP

Wave A is applied. Next gates:

1. Optional: Wave G slice — sync `packages/database` row types for PPR + residency tables  
2. Waves B–F — await explicit approval  

Do not modify Channels / Groups / Resources / Experiences / Local Entities until those waves are approved.
