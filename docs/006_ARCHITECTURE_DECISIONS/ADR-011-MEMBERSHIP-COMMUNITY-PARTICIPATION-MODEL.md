# ADR-011 Membership Community Participation Model

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: Critical
Date: 2026-08-06

---

## Status

Accepted

---

## Context

Life Community OS needs to represent participation inside a Tenant community.

ADR-010 establishes **Person** as an independent human identity — not a User Account, Business Profile, Official Entity, or security boundary.

ADR-001 establishes Foundation Membership as:

```
Person
  → Membership
    → Territory
```

Territory belongs to a Tenant; therefore Membership is tenant-scoped through Territory. Membership is belonging only — never authorization, Role, or Permission.

Foundation already persists `memberships` and enforces Person RLS through Membership → Territory → Tenant (ADR-003).

Open questions:

1. How does Membership express participation in a Tenant community without collapsing Person into Membership?
2. How do Membership and Property Person Relationships stay separate when both may use words like resident/owner?
3. How do future participation types (staff, guest, service_provider, …) fit without becoming AuthZ?

This ADR defines the **Membership Community Participation Model**.

It does not create migrations or tables.

---

## Decision

**Membership is the participation layer** for a Person inside a Tenant community.

**Person identity remains independent.**

### Participation relationship (community view)

```
Tenant
  → Membership
    → Person
```

Membership answers: **does this Person participate in this Tenant community, and how are they classified for community participation?**

### Persistence path (Foundation; unchanged)

```
Person
  → Membership
    → Territory
      → Tenant
```

Membership rows remain territory-scoped (ADR-001).  
Tenant community participation is derived: Membership → Territory → Tenant.

Membership does **not** replace Territory as the Membership parent. Territory remains the community environment; Tenant remains the isolation/commercial root.

### Core rules

1. **Person is not a Membership.**
2. **Membership is not authentication** (not User Account / Identity).
3. **Membership is not a Business Profile.**
4. **Membership is not an Official Entity.**
5. **Property relationships and Memberships are separate concepts** (ADR-008 / ADR-009).
6. Membership type/classification is **not** a platform permission by itself (ADR-001).
7. A Person may have zero, one, or many Memberships across Territories/Tenants (explicit Tenant Context still required per ADR-002).

---

## Domain Model

### Person

Independent human identity (ADR-010). Exists without Membership.

### Membership

Community participation record linking a Person into a Territory (and therefore into a Tenant community).

| Concern | Membership |
|---------|------------|
| Question | Where / how does this Person participate in the community? |
| Parent | Territory (Foundation) |
| Tenant scope | Derived via Territory |
| AuthN | No |
| AuthZ | No (may inform later Authorization inputs only) |
| Property unit role | No — that is Property Person Relationship |

### Property Person Relationship (contrast)

| Concern | Property Person Relationship |
|---------|------------------------------|
| Question | What role does this Person have on a specific Property? |
| Parent | Property → Address → Territory |
| Examples | owner, resident, tenant (renter), manager |
| Replaces Membership? | Never |

A Person can be a Property `owner` without a Membership, or a community `resident` Member without a Property relationship — or both.

### Future participation types (Membership classification)

Membership may classify community participation using types such as:

| Type | Typical community participation |
|------|----------------------------------|
| `resident` | Lives in / participates as resident of the community |
| `owner` | Community participation as property owner (not the Property relationship row) |
| `tenant` | Community participation as renter (domain sense — not SaaS Tenant) |
| `staff` | Works for community operations |
| `administrator` | Community administration participation classification |
| `service_provider` | Provides services in the community |
| `official` | Official / institutional representative participation |
| `guest` | Temporary or limited community participation |

These are **participation classifications**, not Authorization grants and not User Account types.

Exact allowed enums and product defaults are deferred to migration/product configuration; Foundation already stores `membership_type` as configurable text (ADR-001).

---

## Membership vs Person vs User vs Profiles

| Concept | Question | Is participation? | Is login? | Is the human? |
|---------|----------|-------------------|-----------|---------------|
| **Person** | Which human? | No | No | Yes |
| **Membership** | Participation in Tenant community (via Territory)? | Yes | No | No |
| **User Account / Identity** | Who authenticates? | No | Yes | No — may link to Person |
| **Business Profile** | Commercial public representation? | No | No | No |
| **Official Entity** | Verified institutional representation? | No | No | No |
| **Property Person Relationship** | Role on a Property unit? | Unit-level association | No | No |

### Separation rules

1. Creating a Person does not create Membership.
2. Creating Membership does not create a User Account.
3. `administrator` / `staff` Membership types do not replace Security Platform roles/permissions.
4. Property `owner` relationship ≠ Membership type `owner` (related in product language, different entities).
5. Domain Membership type `tenant` (renter participation) ≠ SaaS **Tenant**.

---

## Examples

### Example 1 — Resident

```
Person: Juan García
  └── Membership → Territory: Life Panoramica
        participation type: resident
        (Tenant community: Life Panoramica)
```

Person identity remains Juan. Membership records community participation.

### Example 2 — Property owner living elsewhere

```
Person: Carlos
  ├── Property Person Relationship → Property X (owner)
  └── Membership → Life Panoramica: optional
```

Owning a Property does not automatically require Membership.  
Product may later encourage or require Membership for community features — that is product policy, not identity collapse.

### Example 3 — Staff with login

```
Person: Elena
  ├── Membership → Life Panoramica (staff)
  └── User Account / Identity → linked to Elena
```

Login is Identity. Community participation is Membership. Permissions remain Authorization.

### Example 4 — Service provider

```
Person: Ana
  ├── Membership → Life Panoramica (service_provider)
  └── Business Profile → Ana Reformas (future)
```

Membership classifies community participation. Business Profile carries commercial representation.

---

## Security Alignment

### Principles

- **Tenant is the security / isolation boundary** (with Territory as the community environment ownership path) — ADR-002 / ADR-003.
- **Membership participates in tenant isolation** by linking Person visibility and community-scoped operations into a Territory owned by the Tenant.
- **Membership is not itself a security boundary root** and not Authorization.
- **Person is not a security boundary** (ADR-010).

### Existing Person RLS (Foundation)

Person row access is relationship-derived:

```
Person
  → Membership
    → Territory
      → territories.tenant_id = app_current_tenant_id()
```

Unbound Tenant Context fails closed. Application Tenant Context filtering remains mandatory (defense in depth).

### Membership RLS

Membership rows are already tenant-scoped through Territory → Tenant (Foundation RLS). Future participation-type changes must not introduce Membership-as-permission or Person.tenant_id.

### Evaluation order (unchanged)

```
Identity (User Account)
  → Authentication
  → Tenant Context resolution (fail closed)
  → Authorization (within Tenant Context)
  → Domain: Membership (participation) + Property relationships (unit roles)
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Change Membership parent from Territory to Tenant directly;
- Put `tenant_id` on Person;
- Make Membership Authentication or Authorization;
- Merge Membership with Property Person Relationship;
- Merge Membership with Business Profile or Official Entity;
- Finalize the participation-type enum as unchangeable product law;
- Define RBAC matrices for `administrator` / `staff`;
- Define invitation, onboarding, or guest expiry workflows;
- Define UI for community directories.

---

## Rejected Alternatives

### Person embeds Membership (`person.tenant_id` / `person.role`)

Rejected. Breaks multi-context participation and ADR-001 / ADR-010 independence.

### Membership = User Account

Rejected. AuthN remains Security Platform.

### Membership = Property relationship

Rejected. Community participation ≠ unit-level owner/resident/renter rows (ADR-008).

### Membership type as permission

Rejected. Authorization remains Security Platform (ADR-001).

### Skip Membership when Property relationship exists

Rejected as architecture. Product may make Membership optional for some owners, but the Membership concept remains the participation layer when community belonging is required.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-002 Tenant Isolation Model
- ADR-003 Database Security and RLS Model
- ADR-008 Property Person Relationship Model
- ADR-009 Property Person Relationship Schema
- ADR-010 Person Identity Model
- Security: Identity, Authentication, Authorization
- Product Specification: Person, Membership, Territory

---

## Decision Rule

Until superseded, community participation must be modeled as Membership (Person ↔ Territory → Tenant), kept separate from Person identity, User Account, Business/Official profiles, and Property Person Relationships, without treating Membership type as Authorization.
