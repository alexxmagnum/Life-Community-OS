# ADR-005 Community Area Model

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

Life Community OS needs a flexible geographic organization layer inside a Territory.

ADR-004 established the community geographic hierarchy and fixed that Community Area is optional domain organization, not a security boundary.

The first real customer is **Life Panoramica**:

```
Tenant: Life Panoramica
└── Territory: Life Panoramica
```

Current internal geographic reality inside that Territory:

- Aldea Golf
- Detinsa
- Pinar
- Golfmar
- Hacienda
- Valle Golf
- streets and residential zones that do not belong to a named micro-urbanization

Future communities will add new areas over time without architectural redesign.

Open questions not fully specified by ADR-004:

1. What categories of Community Area exist?
2. May areas nest (parent/child)?
3. What product uses does Area support (organization, targeting, filtering, local experiences)?
4. How does Area relate to Address, Property and Person without changing Membership or RLS?

This ADR defines the **Community Area Model**.

It does not create migrations, schemas, UI, or authorization implementation.

---

## Decision

Introduce **Community Area** as an optional organizational layer inside a Territory.

### Hierarchy

```
Tenant
  → Territory
    → Community Area (optional, many; optionally nested)
      → Address
        → Property
          → Person (via domain relationships; belonging remains Membership)
```

Address may also attach **directly to Territory** when no Community Area applies (ADR-004).

### Core rules

1. Community Area exists only inside exactly one Territory.
2. Community Area is optional — small customers may use `Tenant → Territory` only.
3. New areas can be added for a Territory without platform architecture changes.
4. Community Area is **not** a Tenant, **not** a security boundary, **not** an authorization boundary.
5. RLS and Tenant Context remain based on Tenant / Territory (ADR-002, ADR-003).
6. Community Area inherits security context from its Territory.
7. Membership continues through Territory, not through Area (ADR-001).

---

## Domain Model

### Tenant

SaaS customer / ecosystem boundary.  
Owns commercial isolation and the community environment root.

### Territory

Main community environment and **security isolation boundary**.  
People belong through Membership → Territory.  
All Community Areas are scoped to one Territory.

### Community Area

Geographic subdivision inside a Territory.

Used for:

- organization and navigation;
- communication targeting;
- filtering and search facets;
- local experiences and operational grouping.

**Community Area is not:**

- a Tenant;
- a Territory replacement;
- a security / RLS boundary;
- an authorization / permission boundary;
- a Membership root.

#### Ownership and isolation

| Field / rule | Requirement |
|--------------|-------------|
| Territory link | Mandatory (`territory_id`) |
| Tenant isolation | Inherited via `territory_id → territories.tenant_id` |
| Direct `tenant_id` on Area | Optional denormalization only if it never diverges from Territory; Territory remains authoritative |
| RLS predicates | Must resolve through Territory / Tenant Context — never “area equals session area” as isolation root |

#### Community Area types

The model must support different area categories (configurable classification, not authorization):

| Type | Typical use |
|------|-------------|
| `urbanization` | Named micro-urbanization (e.g. Aldea Golf) |
| `neighborhood` | Neighborhood / barrio |
| `zone` | Broader operational or geographic zone |
| `sector` | Sector / phase within a development |
| `development` | Development / promocion grouping |
| `custom` | Tenant-specific label when standard types do not fit |

Type is organizational metadata. Type must never grant permissions or redefine Tenant isolation.

#### Nesting (optional)

Support optional `parent_area_id` for nested areas within the **same Territory**.

Rules:

- Parent and child must share the same `territory_id`.
- Cycles are forbidden.
- Nesting depth is not fixed by this ADR; Product may constrain UX depth later.
- A root Area has `parent_area_id = null`.
- Nesting does not create nested security boundaries.

Example:

```
Territory: Life Panoramica
└── Community Area: Golf Zone          (type: zone)
      ├── Aldea Golf                   (type: urbanization)
      └── Golfmar                      (type: urbanization)
```

#### Relationship to Address, Property, Person

```
Territory 1 ── * Community Area
Community Area 1 ── * Community Area     (optional parent/child)
Territory 1 ── * Address                 (Address always territory-scoped)
Community Area 0..1 ── * Address         (optional; Address.area may be null)
Address ── Property / Person links       (domain relationships)
Person ── Membership ── Territory        (belonging; unchanged)
```

- **Address** without Area remains valid (independent streets / simple customers).
- **Property** attaches geographically through Address (and thus Territory, optionally Area).
- **Person** belonging remains Membership → Territory; Area/Address describe location context, not ecosystem belonging.

---

## Examples

### Example 1 — Life Panoramica flat areas

```
Tenant: Life Panoramica
└── Territory: Life Panoramica
    ├── Area: Aldea Golf     (urbanization)
    ├── Area: Detinsa        (urbanization)
    ├── Area: Pinar          (urbanization)
    ├── Area: Golfmar        (urbanization)
    ├── Area: Hacienda       (urbanization)
    ├── Area: Valle Golf     (urbanization)
    └── Addresses with no Area
```

### Example 2 — Nested Golf Zone

```
Territory: Life Panoramica
└── Area: Golf Zone (zone)
      ├── Aldea Golf (urbanization)
      └── Golfmar (urbanization)
```

Isolation for all rows still resolves to Tenant Life Panoramica through Territory.

### Example 3 — Small customer (no areas)

```
Tenant: Acme Residences
└── Territory: Acme Residences
      └── Addresses…
```

No Community Area rows required.

### Example 4 — Targeting vs belonging

```
Person: Alex
  └── Membership → Territory: Life Panoramica
  └── lives at Address → Area: Aldea Golf
```

Communication may target Area `Aldea Golf`.  
Access/isolation still uses Tenant Context → Territory.  
Membership is not “member of Aldea Golf” as a security grant.

---

## Consequences

1. ADR-004 geographic hierarchy remains authoritative; this ADR specializes Community Area.
2. Future `community_areas` persistence must include `territory_id`, area type, and optional `parent_area_id` with same-territory and acyclic constraints.
3. RLS for Area (and Address/Property via Area) must inherit Tenant isolation through Territory — never per-area tenancy.
4. Product can add Panoramica areas without new architectural ADRs for each urbanization name.
5. Nested areas enable zone rollups (e.g. Golf Zone) without changing Membership or Tenant Context.
6. Filtering, campaigns and local experiences may key off Area id/type while Authorization remains Security Platform within Tenant Context.
7. Migrations for Community Area are a follow-up engineering task; this ADR does not ship DDL.

---

## Non-goals

This ADR does not:

- Change Tenant / Territory isolation or RLS from ADR-001–003;
- Make Community Area a Tenant, Territory, or AuthZ boundary;
- Move Membership from Territory to Area;
- Put `tenant_id` on Person or make Person area-owned;
- Require Areas for every Territory or Address;
- Define map geometry, GIS providers, cadastral standards, or UI;
- Freeze the area-type list as unchangeable product law (types may extend via configuration later without superseding isolation rules);
- Define full Address / Property schemas;
- Create database migrations or application code;
- Define cross-territory or cross-tenant shared areas.

---

## Rejected Alternatives

### Area as Membership root

Rejected. Belonging remains Territory-scoped (ADR-001). Area is organization/targeting only.

### Area-level Tenant Context / RLS

Rejected. Would fragment isolation and conflict with ADR-002/003/004.

### Hard-coded Panoramica areas in platform architecture

Rejected. Area names are tenant data; the model must allow additive areas without code changes.

### Mandatory parent “catch-all” area for every Address

Rejected. Direct Territory Addresses remain valid (ADR-004).

### Separate security model for nested vs flat areas

Rejected. Nesting is organizational; security path is always Territory → Tenant.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-002 Tenant Isolation Model
- ADR-003 Database Security and RLS Model
- ADR-004 Community Geographic Model
- Product Specification: Territory, Person, Membership
- Data Model: Multitenancy, Entities, Relationships
- Reference: Life Panoramica geographic structure

---

## Decision Rule

Until superseded, every design that introduces Community Areas must keep them optional, territory-scoped, typable, optionally nestable, and never as Tenant isolation or Membership/authorization roots.
