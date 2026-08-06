# ADR-006 Physical Location Model

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

Life Community OS needs a physical location model for real communities.

Existing geographic decisions:

- **Tenant** is the SaaS customer / isolation and commercial root (ADR-001);
- **Territory** is the main community environment and security isolation boundary (ADR-001, ADR-002, ADR-003);
- **Community Area** is an optional organizational subdivision inside a Territory (ADR-004, ADR-005).

Current hierarchy before this ADR:

```
Tenant
  → Territory
    → Community Area (optional)
```

Open questions:

1. What represents a real-world physical location (street, number, unit access point)?
2. Must every location sit inside a named Community Area?
3. How do future Property, resident, owner, service and incident links attach to geography without changing Tenant isolation?

The first real customer (Life Panoramica) has both named micro-urbanizations and independent streets/residential pockets without a named area.

This ADR defines the **Physical Location Model** centered on **Address**.

It does not create migrations, tables, UI, or authorization implementation.

---

## Decision

Introduce **Address** as the physical location layer.

### Hierarchy

```
Tenant
  → Territory
    → Community Area (optional)
      → Address

Address always belongs to a Territory.
Address MAY reference a Community Area; Community Area is optional.
```

### Core rules

1. **Address always belongs to a Territory** (mandatory `territory_id` path).
2. **Address may belong to a Community Area** (`community_area_id` nullable).
3. When `community_area_id` is set, that Area must belong to the **same Territory** as the Address.
4. **Address is never a security boundary.**
5. **Security / RLS isolation remains Tenant → Territory** (ADR-002, ADR-003).
6. Community Area remains organizational only (ADR-005); linking an Address to an Area does not create area-level tenancy.
7. Membership and Person belonging remain Territory-scoped (ADR-001); Address does not replace Membership.

---

## Domain Model

### Territory

Main community boundary and security isolation context.  
Every Address is territory-scoped so tenant isolation inherits through `territories.tenant_id`.

### Community Area

Optional geographic organization layer inside a Territory.  
Examples: urbanization, neighborhood, zone, sector, development, custom (ADR-005).  
Used for grouping, filtering, targeting and local organization — not isolation.

### Address

Physical location inside a Territory.  
Represents a real-world location (for example street and number, with room for future structured fields).

| Rule | Requirement |
|------|-------------|
| Territory link | Mandatory |
| Community Area link | Optional |
| Same-territory Area | If Area is set, Area.territory_id must equal Address.territory_id |
| Security role | None — inherits isolation via Territory |
| Authorization role | None — Authorization remains Security Platform within Tenant Context |

### Relationship summary

```
Territory 1 ── * Address
Community Area 0..1 ── * Address
Address ── future links → Property, Residents, Owners, Services, Incidents, Deliveries, Local experiences
```

### Future relationships (out of schema scope here)

Address may later connect to:

- Property
- Residents
- Owners
- Services
- Incidents
- Deliveries
- Local experiences

Those links attach domain behaviour to a physical place. They do not make Address a Tenant, Territory, Membership root, or RLS isolation key.

### Security mapping

| Concept | Security / isolation role |
|---------|---------------------------|
| Tenant | Isolation and commercial root |
| Territory | Community isolation path for RLS / Tenant Context |
| Community Area | None (organization only) |
| Address | None; inherits via Territory |

---

## Examples

### Example 1 — Address inside a Community Area

```
Tenant: Life Panoramica
└── Territory: Life Panoramica
    └── Community Area: Aldea Golf
          └── Address: Street X, number Y
```

Isolation resolves: Address → Territory → Tenant Life Panoramica.  
Area is organizational grouping only.

### Example 2 — Address without a Community Area

```
Tenant: Life Panoramica
└── Territory: Life Panoramica
    └── Community Area: null
          └── Address: Street Z, number Y
```

Valid and first-class. Supports independent streets and residential zones without a named micro-urbanization (ADR-004 / ADR-005).

### Example 3 — Small customer

```
Tenant: Acme Residences
└── Territory: Acme Residences
      └── Addresses…   (no Community Areas required)
```

### Example 4 — Future Property link (conceptual)

```
Address: Street X, number Y
  └── Property: Unit 12
        └── (later) residents / owners via domain relationships
```

Property isolation still inherits through Address → Territory → Tenant.

---

## Consequences

1. Future `addresses` persistence must include mandatory `territory_id` and optional `community_area_id`.
2. RLS for Address must use the Territory → Tenant path (same pattern as Community Area), never area-id as isolation root.
3. Application Tenant Context filtering remains mandatory (defense in depth, ADR-003).
4. Product UX may filter by Area while queries remain tenant-scoped through Territory.
5. “Zona general” or similar Areas may be used operationally, but the model must not *require* an Area for every Address.
6. Property and related domains can depend on Address without waiting for Area to become a security concept.
7. Migrations for Address are a follow-up engineering task; this ADR does not ship DDL.

---

## Non-goals

This ADR does not:

- Change Tenant / Territory isolation or Membership rules (ADR-001–003);
- Make Address or Community Area a security or authorization boundary;
- Require Community Area on every Address;
- Define full postal/GIS schemas, geocoding providers, or map UI;
- Define Property, Resident, Owner, Service, Incident, Delivery or Experience schemas;
- Create database migrations or application code;
- Put `tenant_id` on Address as a substitute for Territory (Territory remains the required path; optional denormalized `tenant_id` only if it never diverges and Territory stays authoritative);
- Define cross-territory or cross-tenant shared addresses.

---

## Rejected Alternatives

### Address without Territory (Area-only parent)

Rejected. Isolation and community environment require Territory (ADR-001, ADR-004).

### Address as security boundary / Tenant Context key

Rejected. Would fragment isolation and conflict with ADR-002/003.

### Mandatory Community Area on every Address

Rejected. Independent streets and simple customers need direct Territory Addresses (ADR-004).

### Person owned by Address

Rejected. Person belonging remains Membership → Territory (ADR-001). Address may relate to people later without owning Person.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-002 Tenant Isolation Model
- ADR-003 Database Security and RLS Model
- ADR-004 Community Geographic Model
- ADR-005 Community Area Model
- Product Specification: Territory, Person, Membership
- Data Model: Multitenancy, Entities, Relationships
- Reference: Life Panoramica geographic structure

---

## Decision Rule

Until superseded, every design that models physical locations must treat Address as territory-scoped (optionally area-linked), never as a security boundary, with Tenant → Territory remaining the isolation path.
