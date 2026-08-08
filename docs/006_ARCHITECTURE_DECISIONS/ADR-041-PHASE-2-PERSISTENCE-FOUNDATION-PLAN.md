# ADR-041 Phase 2 Persistence Foundation Plan

Version: 1.4
Status: Accepted — Wave A + Wave B applied
Document Type: Architecture Decision Record
Priority: Critical
Date: 2026-08-08

---

## Status

**Wave A applied** (`20260808100000`).  
**Wave B applied** (`20260808110000`–`20260808130000`) — Official Entity Profiles + demo Authority/Municipality seeds.

Waves C–F remain unapproved. Wave G typed sync still outstanding.

---

## Context

Phase 1 Community Communication Foundation is complete and **READY FOR PERSISTENCE** ([16_PHASE_1_COMMUNITY_COMMUNICATION_COMPLETION.md](../018_ROADMAP/16_PHASE_1_COMMUNITY_COMMUNICATION_COMPLETION.md)).

Domain contracts and ADRs 035–040 are closed. This ADR records the **persistence plan**: audit, mapping, migration proposal, RLS strategy, risks, and rollback.

---

## Decision

1. Persist Phase 1 aggregates by **extending** the existing Supabase foundation (Tenant → Territory isolation + geography + Property Person Relationship spine).  
2. **Do not** redesign the domain or add ChatRoom / Activity / SportActivity aggregates.  
3. Execute migrations **wave-by-wave** after explicit approval of each wave’s SQL review.  
4. Full mapping, DDL intent, RLS, risks, and rollback are documented in:

   `docs/013_DATA_MODEL/10_PHASE_2_PERSISTENCE_FOUNDATION_PLAN.md`

5. **Wave A (approved to prepare):** PPR CHECK extensions + `residency_verifications` + `residency_verification_evidence` + RLS + ADR-037 helper. No Channels / Groups / Resources / Experiences / Local Entities.

---

## Consequences

### Positive

- Clear, reviewable path from ADR contracts to tables  
- Reuses proven RLS inheritance patterns  
- Fail-closed residency and private channel rules preserved  

### Negative / follow-ups

- Typed `packages/database` schema lags SQL and must be updated in the same delivery wave as migrations  
- PPR CHECK constraints must expand carefully (backward-compatible ALTER)  

---

## References

- ADR-002, ADR-003, ADR-005–ADR-011  
- ADR-027, ADR-029, ADR-031  
- ADR-035–ADR-040  
- `supabase/migrations/*`  
- `packages/types/src/domain/*`
