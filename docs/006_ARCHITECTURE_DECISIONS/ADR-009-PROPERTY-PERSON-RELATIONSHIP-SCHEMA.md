# ADR-009 Property Person Relationship Schema

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

The platform needs a flexible relationship model between Property and Person.

ADR-007 defines Property as an address-scoped real estate unit that does not own people.

ADR-008 defines the Property Person Relationship as a time-aware, many-to-many association layer and forbids embedding `owner_id`, `resident_id`, or Person-pointing `tenant_id` on Property.

This ADR records the **schema-oriented decision**: Property Person Relationship is an **independent domain entity** with a stable conceptual field set for future persistence.

It does not create migrations or tables.

---

## Decision

Create **Property Person Relationship** as an independent domain entity.

### Relationship shape

```
Property
  → Property Person Relationship
    → Person
```

### Core rules

1. Property does not own Person.
2. Person can relate to multiple Properties.
3. Property can have multiple Persons (via multiple relationship rows).
4. Relationships have lifecycle (status + time bounds).
5. Relationships are not security boundaries.
6. Isolation remains **Tenant → Territory**, inherited through Property → Address → Territory → Tenant.
7. Domain relationship type `tenant` (renter) must never be confused with SaaS **Tenant**.

### Future entity fields

| Field | Purpose |
|-------|---------|
| `id` | Stable identity of the relationship row |
| `property_id` | Reference to Property (mandatory) |
| `person_id` | Reference to Person (mandatory) |
| `relationship_type` | Role classification |
| `start_date` | When the relationship begins |
| `end_date` | When the relationship ends (nullable while open) |
| `status` | Lifecycle status |
| `metadata` | Extensible non-relational attributes |
| timestamps | `created_at` / `updated_at` (or equivalent) |

Exact SQL types, nullability refinements, and uniqueness indexes are deferred to migration design, within these rules.

---

## Relationship Types

| Type | Meaning |
|------|---------|
| `owner` | Ownership interest in the Property |
| `resident` | Lives at / occupies the Property |
| `tenant` | Rents / leases the Property (domain renter — not SaaS Tenant) |
| `authorized_person` | Explicit association without ownership/residency/rental |
| `manager` | Operational management association |

`relationship_type` is classification metadata for domain behaviour.  
It is not a permission and not a Tenant isolation key.

---

## Lifecycle

Relationships are durable associations with explicit lifecycle, not disposable join rows only.

Recommended `status` values for future persistence:

| Status | Meaning |
|--------|---------|
| `active` | Currently in effect |
| `inactive` | Temporarily not in effect |
| `ended` | Concluded; retain for history |
| `archived` | Historical / non-operational retention |

Time rules:

1. `start_date` marks the beginning of the association.
2. `end_date` marks the end; may be null while the relationship remains open.
3. Prefer status + `end_date` over destroying history needed for community operations.
4. Multiple concurrent relationships (including same type) are allowed unless a later product constraint says otherwise.

Lifecycle of a relationship does not change Tenant isolation and does not replace Membership → Territory belonging.

---

## Examples

### Example 1 — Multiple roles on one Property

```
Property: Casa Golf 25
  ├── Relationship → Juan  (owner, active)
  ├── Relationship → Maria (resident, active)
  ├── Relationship → Pedro (tenant/renter, active)
  └── Relationship → Ana   (authorized_person, active)
```

### Example 2 — One Person, many Properties

```
Person: Alex
  ├── Relationship → Apartment 2B (owner)
  └── Relationship → Garage G12  (resident)
```

### Example 3 — Ended residency

```
Property: Apartment 3A
  └── Relationship → Sam (resident)
        start_date: 2025-01-01
        end_date:   2025-12-31
        status:     ended
```

### Example 4 — Manager

```
Property: Local Comercial 5
  └── Relationship → Ops Lead (manager, active)
```

---

## Security Alignment

| Concept | Security / isolation role |
|---------|---------------------------|
| Tenant | Isolation and commercial root |
| Territory | Community isolation path for RLS / Tenant Context |
| Property | Inherits via Address → Territory; not an isolation root |
| Property Person Relationship | **Not** a security boundary |
| Person | Independent; tenant visibility remains Membership-mediated + Authorization |
| `relationship_type` | Not a permission |

### Isolation inheritance for future RLS

```
Property Person Relationship
  → Property
    → Address
      → Territory.tenant_id
        → app_current_tenant_id()
```

### Constraints

- No relationship-based Tenant Context.
- No AuthZ implied solely by `owner` / `resident` / `tenant` / `manager` / `authorized_person`.
- Application Tenant Context filtering remains mandatory (defense in depth, ADR-003).
- SaaS Tenant is never derived from relationship type `tenant`.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Finalize PostgreSQL DDL, indexes, or RLS policy SQL;
- Add Person foreign keys onto Property;
- Define Authorization / RBAC matrices for property roles;
- Replace Membership with Property relationships;
- Define legal title, lease contracts, or billing schemas;
- Define UI for household or ownership management;
- Freeze the type list as unchangeable product law (extensions allowed without changing isolation rules).

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-003 Database Security and RLS Model
- ADR-007 Property Model
- ADR-008 Property Person Relationship Model
- Security: Identity, Authentication, Authorization
- Data Model: Relationships, Multitenancy

---

## Decision Rule

Until superseded, Property ↔ Person associations must be persisted (when implemented) as an independent Property Person Relationship entity with the field intent defined here, never as ownership columns on Property, and never as a security boundary.
