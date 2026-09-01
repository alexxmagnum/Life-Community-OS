# MEMBERSHIP_ONBOARDING_AUDIT.md

**Phase:** 17Y — Membership & Community Onboarding Experience  
**Date:** 2026-09-01  
**Constraint:** No GlobalUserEntity, UniversalIdentityEntity, SocialAccountEntity, ResidentScore, VerificationScore, OwnerTrustScore, or CrossTenantMembership. Never `if tenant === panoramica`.

Hierarchy: PLATFORM → TENANT → TERRITORY → PERSON → MEMBERSHIP → DOMAIN DATA.

---

## 1. Person vs Membership

`Person` = global human identity.  
`Membership` = relationship of that person with a Territory (tenantId, territoryId, status, role).

One person may hold multiple memberships across territories without automatic access to all.

---

## 2. Membership lifecycle

Statuses: `pending`, `active`, `invited`, `suspended`, `removed` (+ legacy `inactive`, `ended`).

Only `active` grants community access via `membershipGrantsCommunityAccess()`.

Flow: Register → Person → pending (optional) → validation → active.

---

## 3. Community access methods

| Method | Flow |
|--------|------|
| Community code | Code → tenant + territory resolved → membership created |
| Invitation | Member/admin invites → accept → active |
| Admin approval | pending → administrator approves → active |

Codes carry no permissions, roles, or capabilities.

---

## 4. Guest access

Guest ≠ Member. Guests may view public info, places, and open content. Guests cannot participate, reserve privately, access community, or view private activity.

Conversion: Guest → Register → Membership.

---

## 5. Role assignment

Registration never creates administrator, moderator, or manager. Client-supplied `role`, `tenantId`, `territoryId`, or `membershipId` → `403 owner_immutable`.

---

## 6. Duplicate detection

Normalized email and provider reference prevent duplicate identity. Multiple persons per household (same address) remain allowed.

---

## 7. Housing relationship

Owner/resident/guest belongs to Housing domain. Membership only answers: can this person participate in this Territory?

---

## 8. Magic Plus

FAB visibility requires active membership + creation capability (`magicPlusEligible`). Not tied to owner role or manual review.

---

## 9. Privacy integration (17X)

Onboarding respects consent, activity visibility, and invitation preferences without exposing private history.

---

## 10. Admin experience

`/admin/members` — view directory, invite, approve pending. Cannot change tenant, create territories, or modify SaaS plan.

---

## 11. Validation

- `pnpm -r typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm --filter @life-community-os/types test` — 200 PASS
- `pnpm --filter @life-community-os/web test:isolation` — 335 PASS
- `pnpm --filter @life-community-os/web build` — PASS

---

## 12. Invariants

Person ≠ Membership · Membership ≠ Role · Role ≠ Capability · Tenant ≠ Territory · Privacy ≠ Permission · Community Access ≠ Ownership
