# ADR-037 Residency-Derived Access Model

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

Resource access is scoped by Community Area (ADR-036). Users change residences over time while keeping the same account / Person identity.

Hardcoding Community Area permissions on the User or Person entity would:

- break when someone moves (e.g. Aldea Golf → Zona Verde);
- conflate identity with location;
- duplicate Authorization;
- fight ADR-008 / ADR-010 / ADR-011.

Existing decisions already provide the relationship layer:

- **Person** — stable human identity (ADR-010); not an auth account alone  
- **Membership** — Territory community participation (ADR-011); not AuthZ  
- **Property** — unit at an Address (ADR-007)  
- **Property Person Relationship** — time-aware Person ↔ Property roles (ADR-008 / ADR-009)  
- **Community Area** — optional organization on Address / Territory (ADR-005)  
- **Resource access policy** — visibility vs reservation (ADR-036)

Open questions:

1. How is area-scoped resource access derived when residences change?
2. How do owners, tenants (renters), family members, guests, and staff fit without User-level area flags?
3. How do temporal validity (`validFrom` / `validTo`) and active status drive eligibility?

This ADR defines the **Residency-Derived Access Model**.

It does not create migrations or tables. Foundation SQL already has `property_person_relationships` (ADR-008/009). Expanding allowed relationship types in SQL is a follow-up migration if needed.

---

## Decision

**Access control must not be permanently attached to users.**

A Person’s Community Area resource eligibility is **derived** from **active** residency / property relationships — not from fields on Person or User Account.

```
Person (identity — stable)
  → PropertyPersonRelationship (time-bounded role)
    → Property (unit)
      → Address
        → Community Area? (organization)
        → Territory
          → Tenant
```

Example:

1. John has active relationship to Aldea Golf Unit 14B → derives Aldea Golf resource reservation eligibility.  
2. John moves to Zona Verde → end previous relationship (`validTo` + status); create new active relationship.  
3. Same Person / account. Only active relationships change. Resource access follows the new residence.

### Core rules

1. **Do not** store `communityAreaId` / area permission lists on Person or User Account as the source of truth.  
2. **Do** derive area affiliations from active Property Person Relationships (+ Property → Address → Community Area).  
3. Territory **Membership** remains required for community participation (ADR-011); it does not replace residency.  
4. Relationship type is classification — **not** a Permission (ADR-008 / ADR-012).  
5. RBAC still gates `reserve` / `manage`; residency supplies **area eligibility inputs** to ADR-036 evaluation.  
6. Domain role `tenant` means **renter** — never SaaS Tenant.

---

## Relationship roles (residency / association)

Aligned with ADR-008, extended for product clarity:

| Type | Meaning |
|------|---------|
| `owner` | Ownership interest |
| `resident` | Lives at / occupies the unit |
| `tenant` | Rents / leases (domain renter) |
| `family_member` | Household family association |
| `guest` | Temporary guest association |
| `staff` | Staff association (operations) |
| `authorized_person` | Explicit non-owner/resident association (ADR-008) |
| `manager` | Property management association (ADR-008) |

Which roles **grant Community Area resource eligibility** is policy configuration (default: `owner`, `resident`, `tenant`, `family_member`; guests/staff may be narrower or time-limited). Eligibility never equals RBAC Permission.

---

## Temporal validity

| Field (TypeScript) | Persistence concept | Meaning |
|--------------------|---------------------|---------|
| `validFrom` | `start_date` | Relationship begins |
| `validTo` | `end_date` | Relationship ends (omit while open) |
| `status` | `status` | `active` \| `inactive` \| `ended` \| `archived` |

### Active residency rules

A relationship contributes to derived access at time `T` only when:

1. `status === active`  
2. `validFrom` is null/undefined or `validFrom <= T`  
3. `validTo` is null/undefined or `validTo >= T` (date-end semantics defined at persistence)

When John moves:

1. Set `validTo` and transition status to `ended` on the Aldea Golf relationship.  
2. Create a new active Zona Verde Unit relationship with new `validFrom`.  
3. Recompute derived Community Area ids — no Person mutation of hardcoded areas.

---

## Derivation for Resource access (ADR-036)

```
active PropertyPersonRelationships (eligibility roles)
  → Properties
  → Addresses.communityAreaId
  → communityAreaIds[]
  → evaluateResourceAccess(actor.communityAreaIds)
```

| Input | Source |
|-------|--------|
| `actor.communityAreaIds` | Derived from active residencies — **not** Person fields |
| `actor.canReservePermission` | RBAC |
| Resource `accessPolicy` | ADR-036 |

Seeing public Territory information may require Membership alone; **reserving area-scoped resources** requires derived area affiliation.

---

## Explicitly out of scope

- Hardcoding area permissions on User/Person  
- Making Property Person Relationship a security boundary  
- Full guest product / staff HR systems  
- Expanding SQL `relationship_type` CHECK in this ADR (follow-up migration when persisting new types)  
- Changing ADR-036 visibility vs reservation split  

---

## Consequences

### Positive

- Moves preserve identity; access follows residence  
- Reuses ADR-007/008/009 Property graph  
- Clean input into ADR-036 evaluators  

### Negative / follow-ups

- Product must maintain Address → Community Area links  
- SQL CHECK may need `family_member` / `guest` / `staff` before persisting those types  
- Demo wiring deferred  

---

## Compliance

Until superseded:

1. Resource area eligibility is residency-derived.  
2. Person/User must not be the durable store of Community Area access lists.  
3. Temporal validity + status define “active”.  
4. Type contracts expose derivation helpers before broader product wiring.

---

## References

- ADR-005 Community Area Model  
- ADR-007 Property Model  
- ADR-008 Property Person Relationship Model  
- ADR-009 Property Person Relationship Schema  
- ADR-010 Person Identity Model  
- ADR-011 Membership Community Participation Model  
- ADR-036 Resource Access Scoping by Community Area  
