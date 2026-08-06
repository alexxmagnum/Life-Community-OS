# ADR-008 Property Person Relationship Model

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

Life Community OS needs to model relationships between people and properties.

ADR-007 establishes:

- **Property** is a real estate unit located at an Address;
- Property does not own people;
- future Property ↔ Person links use roles;
- isolation for Property inherits through Address → Territory → Tenant.

ADR-001 establishes:

- **Person** is an independent domain identity without direct `tenant_id`;
- belonging to a community ecosystem is through Membership → Territory → Tenant;
- Membership is not authorization.

ADR-003 establishes Tenant → Territory as the database isolation path for tenant-owned and territory-linked data.

Open questions:

1. How to associate owners, residents, renters and authorized people with a Property?
2. How to avoid embedding people on Property via `owner_id`, `resident_id` or confusing SaaS `tenant_id` columns?
3. How to support many-to-many, time-bounded relationships without making the link a security boundary?

This ADR defines the **Property Person Relationship Model**.

It does not create migrations, tables, UI, or authorization implementation.

---

## Decision

Introduce a **relationship layer** between Property and Person.

### Hierarchy

```
Tenant
  → Territory
    → Address
      → Property
        → Property Person Relationship
          → Person
```

### Core rules

1. **Property must not directly own a Person.**
2. **Avoid direct columns on Property** such as `owner_id`, `resident_id`, or SaaS-style `tenant_id` pointing at a Person.
3. Associations are rows in a relationship entity (conceptual name: **Property Person Relationship**).
4. A Property can have **multiple** relationships (including multiple people in the same role).
5. A Person can relate to **multiple** Properties.
6. Relationships are **time-aware** (start / end) and have **lifecycle status**.
7. **Relationship is not a security boundary** and not an authorization grant by itself.
8. Isolation remains **Tenant → Territory**, inherited through Property → Address → Territory → Tenant.
9. Domain renter role `tenant` must never be confused with SaaS **Tenant**.

---

## Domain Model

### Property

A real estate unit located at an Address (ADR-007).  
Does not embed Person foreign keys for owner/resident/renter.

### Person

An individual domain entity (ADR-001).  
Not owned by Property. Ecosystem belonging remains Membership → Territory.

### Property Person Relationship

A time-aware relationship describing the role a Person has with a Property.

| Concern | Rule |
|---------|------|
| Cardinality | Many relationships per Property; many per Person |
| Role | Stored as relationship type (classification, not AuthZ) |
| Time | Optional/required start and end dates as defined at persistence |
| Status | Lifecycle status independent of Property/Person status |
| Security | None — inherits isolation via Property → Address → Territory → Tenant |
| Authorization | Does not replace Security Platform Authorization |

### Conceptual attributes (future persistence)

| Field | Purpose |
|-------|---------|
| `relationship_type` | Role classification (see Relationship Types) |
| `start_date` | When the relationship begins |
| `end_date` | When the relationship ends (nullable while open) |
| `status` | Lifecycle status |
| `metadata` | Extensible non-relational attributes |

Exact column nullability and date precision are deferred to migration design, within these rules.

### Forbidden Property columns

Do not model people as:

- `properties.owner_id`
- `properties.resident_id`
- `properties.tenant_id` (especially ambiguous with SaaS Tenant)

---

## Relationship Types

| Type | Meaning (domain association) |
|------|------------------------------|
| `owner` | Ownership interest in the Property |
| `resident` | Lives at / occupies the Property |
| `tenant` | Rents / leases the Property (domain renter — **not** SaaS Tenant) |
| `authorized_person` | Explicit association without ownership/residency/rental |
| `manager` | Operational management association for the Property |

Relationship type:

- is configurable classification metadata for product behaviour;
- **never** grants platform permissions by itself;
- **never** defines Tenant isolation;
- may inform Authorization inputs later, but Authorization remains Security Platform within Tenant Context.

Additional types may be added later via configuration without superseding isolation or “no direct Person ownership” rules.

---

## Lifecycle

Relationships have an explicit lifecycle independent of hard-deleting Property or Person.

Recommended status values for future persistence:

| Status | Meaning |
|--------|---------|
| `active` | Relationship is currently in effect |
| `inactive` | Temporarily not in effect |
| `ended` | Relationship has concluded (prefer retaining history) |
| `archived` | Retained for history / compliance, not operationally current |

Time rules:

1. `start_date` marks when the association begins.
2. `end_date` marks when it ends; open-ended relationships may omit `end_date` until closed.
3. Ending a relationship should prefer status transition + `end_date` over destroying history needed for community operations.
4. Overlapping relationships are allowed when product rules permit (for example multiple owners); uniqueness constraints (if any) are product decisions, not security boundaries.

Lifecycle status of a relationship does not change Tenant isolation and does not replace Membership.

---

## Examples

### Example 1 — Casa Golf 25

```
Property: Casa Golf 25
  ├── Juan  → owner
  ├── Maria → resident
  ├── Pedro → tenant (renter)
  └── Ana   → authorized_person
```

All four are separate relationship rows. Property has no `owner_id` / `resident_id` columns.

### Example 2 — One Person, multiple Properties

```
Person: Alex
  ├── owner    → Property: Apartment 2B
  └── resident → Property: Garage G12
```

### Example 3 — Time-bounded residency

```
Property: Apartment 3A
  └── Sam → resident
        start_date: 2025-01-01
        end_date:   2025-12-31
        status:     ended
```

### Example 4 — Manager without residency

```
Property: Local Comercial 5
  └── Agency Staff → manager
        status: active
```

---

## Security Alignment

| Concept | Security / isolation role |
|---------|---------------------------|
| Tenant | Isolation and commercial root |
| Territory | Community isolation path for RLS / Tenant Context |
| Address / Property | Inherit via Territory; not isolation roots |
| Property Person Relationship | **Not** a security boundary; inherits via Property → Address → Territory → Tenant |
| Person | Visibility remains relationship-derived for tenant scope (Membership → Territory) plus Authorization |
| Relationship type | Not a permission |

### Isolation path for future RLS

```
property_person_relationships
  → properties
    → addresses
      → territories.tenant_id
        → app_current_tenant_id()
```

### Evaluation order (unchanged)

```
Identity
  → Authentication
  → Tenant Context resolution (fail closed)
  → Authorization (within Tenant Context)
  → Domain operations (Membership + Property Person Relationships inform belonging/association, not permission)
```

Consequences:

1. Future relationship table RLS must use the Property → Address → Territory path.
2. Application Tenant Context filtering remains mandatory (defense in depth, ADR-003).
3. Having an `owner` / `resident` / `tenant` relationship does not by itself authorize platform actions.
4. SaaS Tenant Context is never taken from a Property Person Relationship type named `tenant`.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Add `owner_id`, `resident_id`, or Person-pointing `tenant_id` on Property;
- Define Authorization matrices or RBAC for property roles;
- Replace Membership with Property relationships;
- Define legal title, deed, or lease contract schemas;
- Define billing, deposits, or rental marketplace behaviour;
- Make Property Person Relationship a Tenant Context or RLS root;
- Collapse Person into Property;
- Define UI for household management.

---

## Rejected Alternatives

### Direct `owner_id` / `resident_id` on Property

Rejected. Cannot express multiple concurrent roles, history, or many-to-many cleanly; embeds people ownership on Property.

### Property owns Person

Rejected by ADR-001 / ADR-007. Person remains independent.

### Relationship as security boundary

Rejected. Isolation remains Tenant → Territory (ADR-003, ADR-007).

### Using relationship type `tenant` as SaaS Tenant Context

Rejected. Naming collision is domain-only; SaaS Tenant remains the commercial/isolation root.

### Membership type as property role substitute

Rejected. Membership is Territory belonging; Property roles are unit-level associations.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-003 Database Security and RLS Model
- ADR-006 Physical Location Model
- ADR-007 Property Model
- Security: Identity, Authentication, Authorization
- Product Specification: Person, Membership
- Data Model: Multitenancy, Relationships

---

## Decision Rule

Until superseded, every design that associates people with properties must use a Property Person Relationship layer (many-to-many, time-aware, typed, lifecycle-bearing), must not embed Person ownership columns on Property, and must keep isolation on Tenant → Territory via Property → Address → Territory.
