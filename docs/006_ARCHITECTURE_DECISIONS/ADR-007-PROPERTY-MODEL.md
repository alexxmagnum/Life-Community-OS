# ADR-007 Property Model

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

Life Community OS needs an entity representing real estate units inside community geographies.

Existing decisions:

- **Tenant** is the SaaS customer / isolation and commercial root (ADR-001);
- **Territory** is the main community environment and security isolation boundary (ADR-001–003);
- **Community Area** is optional organizational geography (ADR-004, ADR-005);
- **Address** is the physical location layer, always territory-scoped, never a security boundary (ADR-006).

Current hierarchy before this ADR:

```
Tenant
  → Territory
    → Address
```

Open questions:

1. What represents a house, apartment, commercial unit, garage, storage room or land parcel?
2. How does a unit relate to Address without becoming a security boundary?
3. How do owners, residents and other people relate to units without Property owning Person?

This ADR defines the **Property Model**.

It does not create migrations, tables, UI, or authorization implementation.

---

## Decision

Introduce **Property** as the real-world unit located at an Address.

### Hierarchy

```
Tenant
  → Territory
    → Address
      → Property
```

Community Area may organize Addresses (ADR-005 / ADR-006) but is not required on the Property path. Property isolates through Address → Territory → Tenant.

### Core rules

1. **Property always belongs to an Address** (mandatory address link).
2. **Property is not a security boundary.**
3. **Security / RLS isolation remains Tenant → Territory** (via Address → Territory).
4. **Property does not own people.** Person remains an independent domain identity (ADR-001).
5. Future people links use **Property ↔ Person through roles**, not ownership of Person by Property.
6. Property type is organizational / classification metadata — never a permission or isolation key.

---

## Domain Model

### Address

Physical location (ADR-006).  
One Address may have zero, one, or many Properties (for example multiple units at the same street number).

### Property

A real estate unit located at an Address.

| Rule | Requirement |
|------|-------------|
| Address link | Mandatory |
| Territory path | Inherited: Property → Address → Territory → Tenant |
| Direct `tenant_id` | Not required; Territory path remains authoritative for isolation |
| Security role | None |
| Authorization role | None — Authorization remains Security Platform within Tenant Context |
| Person ownership | Forbidden — Property does not own Person |

### Relationship summary

```
Address 1 ── * Property
Property ── future role links → Person (owner, resident, tenant, authorized_person, …)
```

---

## Property Types

The model must support different unit categories (configurable classification, not authorization):

| Type | Typical use |
|------|-------------|
| `house` | Detached / townhouse dwelling |
| `apartment` | Flat / apartment unit |
| `commercial_unit` | Shop, office, or other commercial premise |
| `garage` | Garage / parking unit |
| `storage_room` | Trastero / storage unit |
| `land` | Plot / land parcel |
| `custom` | Tenant-specific unit when standard types do not fit |

Type never grants permissions and never defines Tenant isolation.

Additional product attributes (size, bedrooms, cadastral references, etc.) may be added later without superseding this ADR’s isolation and belonging rules.

---

## Examples

### Example 1 — Apartment at an Address

```
Tenant: Life Panoramica
└── Territory: Life Panoramica
    └── Address: Street X, number Y
          └── Property: Apartment 3B (type: apartment)
```

### Example 2 — Multiple units at one Address

```
Address: Street X, number Y
  ├── Property: Apartment 1A
  ├── Property: Apartment 1B
  └── Property: Garage G12
```

### Example 3 — House without Community Area

```
Territory: Life Panoramica
└── Address: Street Z, number 10 (community_area_id null)
      └── Property: House (type: house)
```

Isolation still resolves through Territory → Tenant.

### Example 4 — Commercial unit

```
Address: Avenida Central, 5
  └── Property: Local 2 (type: commercial_unit)
```

---

## Future Relationships

Property does not own people.

Future relationships connect **Property ↔ Person through roles**, for example:

| Role | Meaning (domain, not AuthZ by itself) |
|------|----------------------------------------|
| `owner` | Legal or declared ownership interest |
| `resident` | Lives at / occupies the Property |
| `tenant` | Rents / leases the Property (domain sense; not SaaS Tenant) |
| `authorized_person` | Explicitly allowed association without ownership/residency |

Rules for those future links:

1. Person remains independent (no `tenant_id` on Person; ADR-001).
2. Ecosystem belonging remains Membership → Territory.
3. Property–Person roles do not replace Membership, Identity, Authentication or Authorization.
4. Role names like `tenant` (renter) must never be confused with SaaS **Tenant**.
5. Exact persistence for Property–Person roles is deferred to a later ADR/migration.

Property may also later connect to services, incidents, deliveries and local experiences through Address/Property links (ADR-006 future relationships), without changing isolation.

---

## Security Alignment

| Concept | Security / isolation role |
|---------|---------------------------|
| Tenant | Isolation and commercial root |
| Territory | Community isolation path for RLS / Tenant Context |
| Community Area | None (organization only) |
| Address | None; inherits via Territory |
| Property | None; inherits via Address → Territory → Tenant |
| Person | Relationship-derived visibility via Membership → Territory |
| Property ↔ Person roles | Domain association; not a security boundary by themselves |

Consequences for future RLS:

- Property policies must resolve through Address → Territory → `tenant_id` = bound Tenant Context.
- No Property-based Tenant Context.
- No Area-based or Address-based isolation roots.
- Application Tenant Context filtering remains mandatory (defense in depth, ADR-003).

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Define full cadastral, legal title, or mortgage schemas;
- Define Property–Person role tables or permission matrices;
- Make Property, Address or Area a security / authorization boundary;
- Put `tenant_id` on Person or make Property own Person;
- Confuse domain renter (`tenant` role) with SaaS Tenant;
- Require Community Area on every Property’s Address;
- Define booking, commerce, or IoT device models for units;
- Replace Membership with Property residency.

---

## Rejected Alternatives

### Property as security boundary

Rejected. Isolation remains Tenant → Territory (ADR-002, ADR-003, ADR-006).

### Property owns Person (`person.property_id` as belonging)

Rejected. Person independence and Membership → Territory belonging remain mandatory (ADR-001).

### Property without Address (Territory-only unit)

Rejected for Foundation. Physical unit location is anchored at Address; Territory alone is the community environment, not the street-level unit.

### Treating Property type as a permission

Rejected. Type is classification only; Authorization remains Security Platform.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-002 Tenant Isolation Model
- ADR-003 Database Security and RLS Model
- ADR-004 Community Geographic Model
- ADR-005 Community Area Model
- ADR-006 Physical Location Model
- Product Specification: Territory, Person, Membership
- Data Model: Multitenancy, Entities, Relationships

---

## Decision Rule

Until superseded, every design that models real estate units must treat Property as address-scoped, never as a security boundary, never as owner of Person, with isolation inherited through Address → Territory → Tenant.
