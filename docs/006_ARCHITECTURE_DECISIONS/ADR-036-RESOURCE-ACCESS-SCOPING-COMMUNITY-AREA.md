# ADR-036 Resource Access Scoping by Community Area

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: High
Date: 2026-08-08

---

## Status

Accepted

---

## Context

A Territory may contain multiple Community Areas (ADR-005), each with independent resources.

Example:

- Territory: Panoramica Golf  
- Community Areas: Aldea Golf, Zona Verde  
- Resource: Padel Court Aldea Golf  
- Policy: only Aldea Golf residents may reserve; other Territory residents may see public information but cannot reserve.

ADR-031 already states Territory/Area define inventory location and eligibility scope, but does not define a precise **access policy** separating:

- public information visibility;
- reservation eligibility;
- ownership / stewardship;
- future guest, club, paid, and shared-resource cases.

Open questions:

1. How do area-scoped resources avoid assuming “all Territory residents share all resources”?
2. How do visibility and reservation rights differ?
3. How do we prepare shared, private, club, paid, and guest access without building those products now?

This ADR defines **Resource Access Scoping by Community Area**.

It does not create migrations or tables.

---

## Decision

**Resource access is policy-driven and must consider all of:**

1. Tenant isolation (security boundary)
2. Territory membership (participation eligibility baseline)
3. Community Area affiliation(s) of the Person
4. Resource ownership / stewardship (ADR-031 / Phase 1 ownership kinds)
5. Resource access policy (visibility + reservation scope)
6. RBAC Permissions (e.g. `reserve`, `manage`)
7. Booking/availability rules (slots, conflicts — ADR-031)

**Do not assume all residents share all resources.**

```
Tenant isolation
  → Territory Membership
  → RBAC (reserve vs manage)
  → Resource.accessPolicy (visibility + reservation scope)
  → Community Area affiliation match (when scoped)
  → Ownership / operator rules
  → Availability / booking policy
```

Community Area remains **organizational**, not a Tenant or security root (ADR-005). Area scoping is **eligibility**, not a new isolation database.

---

## Visibility vs reservation

| Concern | Meaning |
|---------|---------|
| **Public information visibility** | Whether a Member may see catalog/public facts (name, photo, location blurb) |
| **Reservation eligibility** | Whether a Member may create a reservation / hold a slot |

These are independent.

Example — Padel Court Aldea Golf:

- Visibility: Territory members may see public information  
- Reservation scope: only Persons affiliated with Community Area Aldea Golf  

A Zona Verde resident:

- **Can** see public information  
- **Cannot** reserve  

---

## Access policy model

Attached to each Resource (type contract in `@life-community-os/types`):

### Visibility

| Value | Meaning |
|-------|---------|
| `territory` | Territory members may see public information (default for discoverable amenities) |
| `community_area` | Emphasize / list primarily for home area audience |
| `private` | Restricted listing (eligible actors / stewards) |
| `hidden` | Not in general discovery |

### Reservation scope

| Value | Meaning |
|-------|---------|
| `territory` | Any eligible Territory Member (plus RBAC) may reserve |
| `community_area` | Only Persons affiliated with listed Community Area id(s) |
| `group` | Only members of listed Community Group id(s) — future/group-linked amenities |
| `permit_holders` | Club / permit holders — foundation for club resources |
| `guests_allowed` | Guests may reserve under Tenant policy — foundation only |
| `paid` | Requires commercial entitlement / payment path — foundation flag only |

### Area fields

| Field | Meaning |
|-------|---------|
| `communityAreaId` | Home / location area of the asset (where it sits) |
| `accessPolicy.reservationCommunityAreaIds` | Areas allowed to reserve when `reservationScope = community_area` |
| `accessPolicy.sharedAcrossAreas` | Explicit shared territorial amenity (reservation often `territory`) |

When `reservationScope = community_area` and `reservationCommunityAreaIds` is empty, default to `[communityAreaId]` if set — fail closed if neither is available.

---

## Future cases (foundation, not full product)

| Case | How the model supports it |
|------|---------------------------|
| Shared resources | `reservationScope: territory` and/or `sharedAcrossAreas: true` |
| Private area resources | `reservationScope: community_area` + area id list; optional tighter visibility |
| Club resources | `reservationScope: permit_holders` (+ later permit records) |
| Paid resources | `requiresPayment: true` / `reservationScope: paid` — no payment engine in this ADR |
| Guest access | `allowGuestReservation: true` — still Tenant-scoped; never weakens isolation |

---

## Evaluation rules

Domain evaluation (pure function, no I/O) must answer at least:

- `canViewPublicInfo`
- `canReserve`

Rules:

1. Fail closed on missing Tenant/Territory context.
2. Manage-resource Permission may override reservation eligibility for stewards (audited in product flows — ADR-021).
3. Seeing public information does **not** imply reservation rights.
4. Area affiliation is required for `community_area` reservation scope; Membership alone is insufficient.
5. Ownership kind does not by itself grant every Member reserve rights.
6. Availability/conflict checks run only after reservation eligibility passes.

---

## Explicitly out of scope

- Full payment / checkout engine  
- Hardware access control (locks, gates)  
- Implementing guest identity product  
- Migrations (follow-up after contract review)  
- Changing Community Area into a security boundary  

---

## Consequences

### Positive

- Independent resources per Community Area inside one Territory  
- Clear public-view vs reserve split  
- Extensible to shared / club / paid / guest without parallel modules  

### Negative / follow-ups

- Product must maintain Person ↔ Community Area affiliation data  
- Demo catalogs and flags remain a later Phase 1 slice  
- RLS/policy persistence deferred  

---

## Compliance

Until superseded:

1. Resource access must not assume Territory-wide sharing by default for every asset.  
2. Visibility and reservation scope are distinct.  
3. Community Area scoping is eligibility, not tenancy.  
4. Type contracts expose policy + evaluators before persistence.  

---

## References

- ADR-005 Community Area Model  
- ADR-011 Membership Community Participation Model  
- ADR-012 Roles Permissions Model  
- ADR-031 Community Resources and Reservations Model  
- ADR-034 Community Governance and Administration Model  
- ADR-035 Community Channels Model  
