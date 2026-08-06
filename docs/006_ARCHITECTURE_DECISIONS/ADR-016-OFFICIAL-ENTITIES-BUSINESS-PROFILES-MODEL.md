# ADR-016 Official Entities and Business Profiles Model

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: High
Date: 2026-08-06

---

## Status

Accepted

---

## Context

Life Community OS needs profiles for local services, professionals, businesses and official institutions.

ADR-010 establishes **Person** as an independent human identity — not a User Account, Business Profile, or Official Entity.

ADR-014 / ADR-015 place shared identity and authorization in Platform Core, while microapps (e.g. Services, Community) consume those foundations.

Open questions:

1. How are commercial/professional listings modeled without turning them into Person?
2. How are municipalities, police and public organizations modeled as verified institutions?
3. How does verification and lifecycle work without granting Permissions by profile type?
4. How do profiles remain tenant-safe while supporting public representation?

This ADR defines the **Official Entities and Business Profiles Model**.

It does not create migrations or tables.

---

## Decision

**Separate human identity from public representation.**

### Domain entities

| Entity | Meaning |
|--------|---------|
| **Person** | A real human identity |
| **Business Profile** | Commercial or professional representation |
| **Official Entity Profile** | Verified institutional representation |

### Core rules

1. **Person is not a Business Profile.**
2. **Person is not an Official Entity.**
3. **Business Profiles are not automatically trusted.**
4. **Official Entities require verification.**
5. **Public profiles require lifecycle status.**
6. Public representation **does not create permissions**; RBAC controls management actions (ADR-012 / ADR-015).
7. **Tenant remains the security boundary**; profiles inherit Tenant Context where applicable.
8. Profiles are reusable Core/domain representations consumable by microapps (e.g. Services, Community) — not hardcoded to one Tenant.

---

## Domain Model

### Person

Stable human identity (ADR-010).  
May link to User Account, Membership, Property relationships, and zero or more public profiles.

### Business Profile

Commercial or professional public representation.

Examples:

- plumber
- electrician
- pharmacy
- supermarket
- restaurant
- mobile services

Characteristics:

- represents a business or professional offering, not the human row;
- may be claimed/linked by one or more Persons (management/association links — exact cardinality deferred);
- may declare service coverage (Territory / Community Area organizational scope — not a new isolation root);
- starts untrusted until reviewed/verified per product rules.

### Official Entity Profile

Verified institutional representation.

Examples:

- municipality
- police
- emergency services
- public organizations

Characteristics:

- represents an institution, not a Person;
- requires **controlled verification** before trusted official behaviour (e.g. official communications);
- may have appointed Person representatives for management (RBAC-gated);
- must not be creatable as a casual self-serve “verified official” without platform/tenant controls.

### Relationship shape (conceptual)

```
Person
  ├── Business Profile (optional, many over time)
  └── Official Entity Profile (as representative / manager — not as the entity itself)

Business Profile
  └── coverage / visibility within Tenant → Territory / Area (organizational)

Official Entity Profile
  └── verified institutional presence within Tenant context (as applicable)
```

Microapps such as Services and Community consume these profiles; they do not redefine Person.

---

## Business vs Official vs Person

| Concept | Is the human? | Commercial? | Institutional? | Trusted by default? |
|---------|---------------|-------------|----------------|---------------------|
| **Person** | Yes | No | No | N/A (identity, not public listing trust) |
| **Business Profile** | No | Yes | No | **No** — claim/review required for trust signals |
| **Official Entity Profile** | No | No (public institution) | Yes | **No** until controlled verification |

### Separation rules

1. Do not store business listings as Person rows.
2. Do not store town halls / police as Person rows.
3. Do not grant `community_admin` or tenant Permissions merely because a Business Profile exists.
4. Do not treat “verified business” as equivalent to “verified official.”
5. Official communications channels attach to Official Entity Profiles (and Authorization), not to arbitrary Business Profiles.

---

## Verification Model

### Shared lifecycle status

Public profiles use an explicit lifecycle:

| Status | Meaning |
|--------|---------|
| `draft` | Being prepared; not publicly trusted |
| `pending_verification` | Submitted for review |
| `verified` | Passed required verification controls |
| `suspended` | Temporarily blocked from trusted/public use |
| `archived` | Retained historically; not operational |

Lifecycle status is **not** a Permission. Transitions are Authorization-gated.

### Business Profiles

- Can be **claimed** and **reviewed**.
- Trust signals (badges, directory ranking, booking eligibility) depend on review/verification outcomes.
- Unverified profiles may still exist as `draft` / `pending_verification` with limited visibility per product rules.
- Suspension/archive must not delete Person identity.

### Official Entities

- Require **controlled verification** (tenant admin and/or platform governance — exact workflow deferred).
- `verified` is mandatory before official privileged behaviours (e.g. official announcements attribution).
- Self-serve creation without verification must not yield official trust.
- Representative Persons manage the profile through RBAC — the Person does not become the Official Entity.

### Verification vs RBAC

| Concern | Model |
|---------|--------|
| Can this actor edit this profile? | RBAC Permission + Tenant Context |
| Is this profile trusted publicly? | Lifecycle / verification status |
| Is this an official institution? | Official Entity Profile + controlled verification |

---

## Examples

### Example 1 — External locksmith

```
Person: Alex
  └── Business Profile: Alex Locksmith
        status: pending_verification → verified (after review)
        coverage: Territory Life Panoramica / selected Areas
```

Alex remains Person. The listing is Business Profile.  
Service microapp displays the profile; Permissions control who edits it.

### Example 2 — Town hall

```
Official Entity Profile: Ayuntamiento
  status: verified
  └── official communications via Community microapp (authorized)
```

Not a Person. Not a Business Profile. Verification is controlled.

### Example 3 — Pharmacy as business

```
Business Profile: Farmacia Centro
  type: pharmacy
  status: verified
  linked managers: Persons (RBAC-gated)
```

### Example 4 — Same Person, multiple representations

```
Person: Maria
  ├── Business Profile: Maria Electricidad
  └── Membership: Life Panoramica (resident)
```

Human identity, commercial representation and community participation remain distinct.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for tenant-scoped profile data |
| Profile visibility | Product rules + verification status; still under Tenant Context for tenant Business Data |
| Permissions | RBAC for create/claim/verify/suspend/manage (ADR-012) |
| Person | Not a security boundary; not a profile type (ADR-010) |
| Community Area / Territory | Organizational coverage/visibility; not isolation roots for profiles |
| Public representation | Does not grant Authorization |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed for tenant-scoped management)
  → Authorization (profile management Permissions)
  → Profile domain operation
  → Public trust limited by lifecycle / verification status
```

### Alignment statements

- Profiles inherit Tenant Context where they are tenant Business Data (directory inside a Tenant community).
- Cross-tenant public marketplace behaviour (if ever introduced) requires explicit future ADR contracts — default remains tenant-scoped.
- Official Entity verification is stricter than Business claim/review.
- Microapps consume Core profile concepts; they do not invent parallel “vendor user” identity roots (ADR-015).

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Define full category taxonomies for trades and institutions;
- Define KYC/KYB providers, document checklists, or legal registries;
- Implement Services microapp UI or ranking algorithms;
- Merge Official Entity with ADR community Membership types;
- Define payments for paid listings;
- Allow Business Profiles to send “official” government communications;
- Put `tenant_id` on Person;
- Equate verification status with RBAC roles.

---

## Rejected Alternatives

### Person as the public business listing

Rejected (ADR-010). Breaks one-human / multi-representation and pollutes identity.

### Business and Official as one “Profile” type without verification distinction

Rejected. Official institutions require controlled verification and different trust behaviour.

### Verified badge = admin Permission

Rejected. Trust ≠ Authorization (ADR-012).

### Profiles as separate SaaS tenants

Rejected. Tenant remains the SaaS isolation root; profiles are representations inside platform tenancy rules.

### Unverified Official Entities with full official powers

Rejected. Official Entity Profiles require controlled verification.

---

## Related Domains

- ADR-010 Person Identity Model
- ADR-012 Roles and Permissions Model
- ADR-013 Community Microapp Governance Model
- ADR-014 Microapp Platform Architecture
- ADR-015 Platform Core Services Model
- ADR-003 Database Security and RLS Model
- Product: Services microapp, Directory, official communications
- Security: Authorization, Audit, verification governance

---

## Decision Rule

Until superseded, every public commercial or institutional representation must use Business Profile or Official Entity Profile separately from Person, with explicit lifecycle status, stronger controlled verification for Official Entities, Tenant as security boundary, and RBAC for management — never treating public representation as identity or permission.
