# ADR-004 Community Geographic Model

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

Life Community OS must support real community geographies with different structural complexity.

The first real customer is **Life Panoramica**.

Operational structure observed:

```
Tenant: Life Panoramica
  └── Territory: Life Panoramica
        ├── Aldea Golf
        ├── Detinsa
        ├── Pinar
        ├── Golfmar
        ├── Hacienda
        ├── Valle Golf
        └── independent streets and residential areas
            (without belonging to a named micro-urbanization)
```

Named subdivisions (micro-urbanizations, neighborhoods, residential zones) coexist with informal or street-level locations that are not part of a named area.

Existing Foundation decisions already fix:

- **Tenant** as SaaS customer / isolation and commercial root (ADR-001);
- **Territory** as the primary community environment inside a Tenant (ADR-001);
- Tenant isolation and RLS based on Tenant Context / Territory ownership (ADR-002, ADR-003);
- **Person** without direct `tenant_id`; belonging via Membership → Territory → Tenant (ADR-001).

Open geographic questions:

1. How are micro-urbanizations and neighborhoods modeled without becoming new security boundaries?
2. How can addresses exist inside a named area or directly under a Territory?
3. How can small customers remain simple (`Tenant → Territory`) while large customers support many subdivisions?
4. How do Person and Property attach to geography without breaking Membership or Tenant isolation?

This ADR defines the Community Geographic Model for Foundation and early customer delivery.

It does not create migrations, schemas, UI, or authorization implementation.

---

## Decision

### Hierarchy

```
Tenant
  → Territory
    → Community Area (optional, many)
      → Address
        → Person / Property (via domain relationships)

Address may also attach directly to Territory when no Community Area applies.
```

### Core rule

**Territory remains the security and isolation boundary for community life.**

**Community Area is domain organization only. It is not a security boundary.**

RLS and Tenant Context continue to follow ADR-002 / ADR-003:

- isolation root = Tenant;
- community environment ownership = Territory (`territories.tenant_id`);
- Person visibility remains Membership → Territory → Tenant;
- Community Area never replaces Territory and never defines RLS predicates.

### Scalability of structure

| Customer shape | Model used |
|----------------|------------|
| Small / simple | `Tenant → Territory` (zero or unused Community Areas) |
| Large / complex (e.g. Life Panoramica) | `Tenant → Territory → multiple Community Areas` + direct Territory addresses |

---

## Domain Model

### Tenant

- SaaS customer / ecosystem boundary.
- Owns the community environment commercially and for isolation.
- Example: Life Panoramica (as SaaS Tenant).

### Territory

- Main community environment where community life happens.
- Security and isolation boundary for community-scoped Business Data (through `tenant_id` and Tenant Context).
- People and resources belong through Territory context (Membership and future territory-linked entities).
- Example: Life Panoramica Territory (may be 1:1 with Tenant operationally without forcing 1:1 in the model — ADR-001).

### Community Area

- Geographic subdivision **inside** a Territory.
- Examples: micro-urbanizations, neighborhoods, residential zones, informal areas.
- Optional: a Territory may have zero, one, or many Community Areas.
- **Not** a Tenant.
- **Not** a Territory.
- **Not** a security / RLS boundary.
- **Not** a Membership root (Membership remains Territory-scoped per ADR-001 unless a later ADR changes that).
- Used for navigation, organization, reporting, local operations and address grouping.

### Address

- Physical location.
- Belongs to a Territory (always, for tenant isolation inheritance).
- May optionally reference a Community Area within that Territory.
- When no named area applies (independent streets / residential pockets), Address exists **directly under Territory** with no Community Area.
- Represents geographic location, not identity and not authorization.

### Person

- Human identity in the Domain (ADR-001).
- Does not own Tenant.
- Does not carry `tenant_id`.
- Belongs through **Membership → Territory** (tenant-scoped via Territory).
- May be associated with Address / Property through later domain relationships; those relationships do not replace Membership as belonging.

### Property

- Physical property / unit associated with community geography (definition detail deferred to Product/Data modeling).
- Geographic attachment is through Address (and thus Territory, optionally Community Area).
- Tenant isolation inherits through Territory, not through Community Area.
- Property is not a security boundary.

### Relationship summary

```
Tenant 1 ── * Territory
Territory 1 ── * Community Area     (optional)
Territory 1 ── * Address            (required parent for isolation path)
Community Area 1 ── * Address       (optional; Address.area may be null)
Address ── relationships → Person / Property (domain links; not ownership of Person)
Person ── Membership ── Territory   (belonging; unchanged)
```

### Security mapping (unchanged)

| Concept | Security / isolation role |
|---------|---------------------------|
| Tenant | Isolation and commercial root |
| Territory | Community environment ownership; RLS path |
| Community Area | None (organization only) |
| Address | Inherits tenant isolation via Territory |
| Person | Relationship-derived via Membership → Territory → Tenant |
| Membership | Belonging only; not authorization |
| Property | Inherits tenant isolation via Address → Territory |

---

## Examples

### Example 1 — Life Panoramica (large)

```
Tenant: Life Panoramica
└── Territory: Life Panoramica
    ├── Community Area: Aldea Golf
    │     └── Addresses…
    ├── Community Area: Detinsa
    ├── Community Area: Pinar
    ├── Community Area: Golfmar
    ├── Community Area: Hacienda
    ├── Community Area: Valle Golf
    └── Addresses with no Community Area
          (independent streets / residential areas)
```

Isolation: all rows resolve to Tenant `Life Panoramica` through Territory.  
Organization: Areas group named micro-urbanizations; unaffiliated streets skip Area.

### Example 2 — Small customer

```
Tenant: Acme Residences
└── Territory: Acme Residences
      └── Addresses…   (no Community Areas required)
```

No Community Area table usage required for correct isolation or Membership.

### Example 3 — Person belonging

```
Person: Alex
  └── Membership → Territory: Life Panoramica
        └── (optional) lives at Address in Community Area: Aldea Golf
```

Membership grants belonging to the Territory ecosystem.  
Address/Area describe where; they do not grant Tenant access by themselves.

---

## Consequences

1. Foundation identity and RLS model (ADR-001–003) remain authoritative; this ADR extends geography without revising Tenant/Territory security.
2. Future persistence for Community Area and Address must carry a mandatory Territory path (direct `territory_id` and/or enforced parent chain) so RLS continues to use Tenant/Territory predicates.
3. Community Area must not appear as `tenant_id` substitute, Membership root, or RLS session variable for isolation.
4. Product UX may emphasize Areas for Panoramica without forcing Areas on every Tenant.
5. Addresses without Area are first-class, not exceptions to be hacked into a fake “General” Area unless Product later chooses an optional convenience area.
6. Person remains independent of geography ownership columns; geographic links are additive domain relationships.
7. Property modeling can proceed on Address → Territory without waiting for Area to become a security concept.
8. Multi-Territory Tenants (ADR-001) remain allowed; each Territory may have its own Area tree.

---

## Non-goals

This ADR does not:

- Change Tenant ↔ Territory cardinality or isolation rules from ADR-001–003;
- Make Community Area a Tenant, Territory, or RLS boundary;
- Replace Membership with Address or Area belonging;
- Put `tenant_id` on Person;
- Define Authorization, roles, or permissions for Areas;
- Create database migrations, table DDL, indexes, or RLS policies;
- Define full Property schema, cadastral standards, GIS geometry, or map providers;
- Require every Territory to provision Community Areas;
- Collapse Territory into a list of Areas (Territory remains mandatory);
- Define UI navigation, branding, or Panoramica-specific screens;
- Define cross-tenant shared geography or federation.

---

## Rejected Alternatives

### Community Area as security boundary (Area-level RLS / Tenant Context)

Rejected. Would fragment isolation, complicate Membership, and conflict with ADR-002/003. Areas are organizational only.

### Skip Territory; Tenant → Area

Rejected. Territory is the community environment and isolation path (ADR-001). Panoramica’s named zones are subdivisions, not the SaaS environment root.

### Force a Community Area on every Address (“General” / “Other” mandatory)

Rejected as architectural requirement. Direct Territory Addresses must be allowed for independent streets and simple customers. Product may later offer an optional default area without making it mandatory in the model.

### Person owned by Community Area or Address

Rejected. Person belonging remains Membership → Territory (ADR-001).

### Multiple security models (small tenants without Territory)

Rejected. All customers use Tenant → Territory; Areas remain optional depth.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-002 Tenant Isolation Model
- ADR-003 Database Security and RLS Model
- Product Specification: Territory, Person, Membership
- Data Model: Multitenancy, Entities, Relationships
- Reference: Life Panoramica geographic structure
- Platform Architecture: Tenant Architecture

---

## Decision Rule

Until superseded, every design that models community geography (areas, addresses, properties, local subdivisions) must keep Tenant/Territory as the isolation path and treat Community Area as optional domain organization only.
