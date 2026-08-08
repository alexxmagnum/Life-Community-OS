# 16_PHASE_1_COMMUNITY_COMMUNICATION_COMPLETION

Version: 1.0
Status: Accepted
Document Type: Product Roadmap Architecture
Priority: Critical
Date: 2026-08-08

---

# Purpose

Final Phase 1 completion checklist for the Community Communication Foundation.

Confirms the platform can represent a real territory community **without** becoming a WhatsApp clone or creating parallel architecture.

Source of truth: existing ADRs, domain contracts, architecture, glossary.

---

# PHASE 1 STATUS

## READY FOR PERSISTENCE

Domain closure (Phase 1D) is complete. Persistence implementation may start within the migration scope identified below.

**Not** production-complete. Booking engine, production AuthZ, and full verification product UI remain later phases.

---

# Architecture checklist

- [x] No parallel architecture created (Channel is organization layer only; Experience remains activity aggregate)
- [x] Existing ADRs respected (025–031, 034–040)
- [x] English code / technical documentation standard respected
- [x] Multi-tenant Tenant → Territory isolation preserved
- [x] No WhatsApp-clone ChatRoom aggregate introduced

---

# Domain checklist

- [x] Territory model validated
- [x] CommunityArea (Micro Area) validated
- [x] Channel boundaries validated (ADR-035, ADR-039)
- [x] Experience validated as **only** activity write-model aggregate (ADR-027, ADR-039)
- [x] Resource ownership validated (Authority / Entity — not resident-owned territorial assets)
- [x] Resource access policy validated (visibility ≠ reservation — ADR-036)
- [x] Residency-derived access validated (ADR-037)
- [x] Verification workflow validated — claim does not grant access (ADR-038)
- [x] Permission matrix published (ADR-040)
- [x] User journeys documented (ADR-039)
- [x] No new major aggregates required in Phase 1D

---

# Security checklist

- [x] Claim does not grant access
- [x] Restricted resources protected by area scope + verified residency
- [x] Private channels protected by `requiresVerifiedResidency`
- [x] Evidence not stored on Person (Files references)
- [x] RBAC remains AuthZ; residency role is not Permission

---

# Experience validation (formal)

| Rule | Status |
|------|--------|
| Experience is the only activity aggregate | Confirmed |
| UI may say “Activity” via i18n | Allowed |
| Activity / SportActivity / EventActivity entities | Forbidden |
| Experience may reference Channel, Group, CommunityArea, Resource | Confirmed |

---

# Ready for next phase

- [x] Persistence implementation can start
- [x] Migration scope identified (below)
- [x] UI implementation can continue beyond demo wiring (product surfaces)
- [ ] Production AuthZ migrations / Role Assignments (later)
- [ ] Full booking / payments engine (later)
- [ ] Intelligent diffusion engine (later)

---

# Identified migration scope (not executed in Phase 1D)

When persistence is approved, expected work includes:

1. Expand `property_person_relationships.status` CHECK for `pending_verification`, `rejected` (and align types).  
2. Expand relationship_type CHECK for `family_member`, `guest`, `staff` if not already present.  
3. Tables (Tenant RLS): `channels`, `residency_verifications`, `residency_verification_evidence` (file_id → Core Files).  
4. Promote Experiences / Content / Groups / Resources from in-memory catalogs with FKs: `channel_id`, `group_id`, `community_area_id`, resource ownership + `access_policy` JSON/columns.  
5. Ensure Address → `community_area_id` populated for residency derivation.  
6. No ChatRoom table.

---

# Blocked decisions

**None for domain closure.**

Optional product policies (do not block persistence design):

- Default guest/staff eligibility for private Channels (matrix marks P — fail-closed default is accepted).  
- Whether Experiences may soft-link a Resource without reserve eligibility (default: no bookable bind without `canReserve`).

---

# References

- ADR-035 Community Channels Model  
- ADR-036 Resource Access Scoping by Community Area  
- ADR-037 Residency-Derived Access Model  
- ADR-038 Residency Verification Workflow  
- ADR-039 Phase 1D Channel Boundaries and User Journeys  
- ADR-040 Phase 1D Permission Matrix  
- `PLATFORM_GLOSSARY.md`  
- `packages/types` domain contracts  
- `tenants/life-panoramica` demo catalogs + demo UI validation
