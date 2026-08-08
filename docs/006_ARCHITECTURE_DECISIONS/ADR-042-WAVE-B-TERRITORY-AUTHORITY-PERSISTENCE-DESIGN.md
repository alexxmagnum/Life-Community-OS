# ADR-042 Wave B Territory Authority Persistence Design

Version: 1.2  
Status: Accepted — Wave B applied  
Document Type: Architecture Decision Record  
Priority: Critical  
Date: 2026-08-08  

---

## Status

**Wave B applied** on linked remote (`20260808110000`, `20260808120000`, `20260808130000`).

- Design: [`12_WAVE_B_…`](../013_DATA_MODEL/12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md)  
- SQL review: [`13_WAVE_B_MIGRATION_SQL_REVIEW.md`](../013_DATA_MODEL/13_WAVE_B_MIGRATION_SQL_REVIEW.md)  
- Rollback: `supabase/migrations/down/20260808130000_*.down.sql` then `down/20260808110000_*.down.sql` (manual; not run)

### Locked decisions (honoured in applied DDL)

1. `business_profiles` **deferred**.  
2. Private clubs → Business Profile/Group later; public institutional → Official Entity.  
3. Kind CHECK: `territory_authority` \| `municipality` \| `public_service` \| `other_official`.  
4. Deterministic UUIDs for **demo seeds only**.

Waves C–F remain unapproved.

---

## Context

Wave A (residency + PPR persistence) is complete and verified. Phase 2 Wave B must persist **Territory Authority** and **Official Entity Profiles** so future Official Channels (Wave C), territorial resource stewardship (Wave D), and controlled publishing have stable ownership targets.

ADR-016 already separates Person / Business Profile / Official Entity. ADR-035 requires official channels to be owned by `official_entity`. ADR-040 treats Territory Authority as a **product alias** of Official Entity Profile operators — not a Membership type.

---

## Decision

1. Persist Official Entities in a single table `official_entity_profiles` scoped by `tenant_id` + `territory_id`.  
2. **Territory Authority** is **not** a separate aggregate: it is `kind = territory_authority` (at most one non-archived per Territory).  
3. **`business_profiles` is not part of Wave B** — deferred with LocalEntity/commercial work.  
4. Reuse Tenant → Territory RLS; FORCE RLS; do **not** invent parallel AuthZ or Person area ACLs.  
5. Official Channel ownership (Wave C) uses polymorphic `owner_kind = official_entity` + `owner_id` → profile id — **no** separate communication architecture.  
6. Apply migrations only after explicit SQL review approval.

---

## Consequences

### Positive

- Stable stewardship targets for Channels / Resources  
- Aligns demo Panoramica Administration + Municipality with SQL  
- Preserves ADR-037/038 residency gates  

### Negative / follow-ups

- Demo string IDs must map to deterministic UUIDs at seed time  
- Platform RBAC assignment persistence still deferred  
- `packages/types` / `packages/database` sync after DDL  

---

## References

- ADR-003, ADR-011, ADR-012, ADR-016, ADR-034, ADR-035, ADR-040, ADR-041  
- `docs/013_DATA_MODEL/12_WAVE_B_TERRITORY_AUTHORITY_FOUNDATION_DESIGN.md`  
- `tenants/life-panoramica/src/official-entities.ts`
