# ADR-017 Service Directory Discovery Model

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

Life Community OS needs a reusable **Services** microapp.

Users must discover local businesses, professionals and official entities inside a Tenant community.

ADR-016 separates:

- **Person** — human identity;
- **Business Profile** — commercial/professional representation;
- **Official Entity Profile** — verified institutional representation.

ADR-014 / ADR-015 establish Services as a microapp that consumes Platform Core (Person, RBAC, Files, Tenant security) and must not be hardcoded to a single customer.

Open questions:

1. How does discovery work without becoming booking, payments or marketplace checkout?
2. How do physical location and service coverage differ for mobile / external providers?
3. How do categories, filters and verification status affect visibility without granting Permissions?

This ADR defines the **Service Directory Discovery Model**.

It does not create migrations or tables.

---

## Decision

**Service Directory is a reusable discovery layer** inside the Services microapp.

It **exposes verified and public profiles** for discovery.

It does **not** replace booking, payments or commerce workflows.

### Core rules

1. Directory lists **Business Profiles** and **Official Entity Profiles** (ADR-016) — not Person rows as listings.
2. **Directory visibility does not grant permissions.**
3. **Verification status controls trust** (and may gate elevated directory placement), not Authorization.
4. **Tenant remains the security boundary.**
5. **Profiles inherit platform security** (Tenant Context, RLS paths, RBAC for management).
6. **Services microapp consumes Platform Core** (ADR-015) — no parallel identity or permission systems.
7. The directory is reusable across Tenants; Life Panoramica is configuration, not hardcoding.

```
Services Microapp
  └── Service Directory (discovery)
        ├── Business Profile
        └── Official Entity Profile
              ↑ consumes
         Platform Core (Person links, Files, RBAC, Notifications, Tenant…)
```

---

## Profile Discovery Model

### Discoverable profiles

| Profile | Discovery purpose |
|---------|-------------------|
| **Business Profile** | Commercial / professional services |
| **Official Entity Profile** | Institutional services and official presence |

Person may manage or be linked to profiles; Person is not the directory card.

### Discovery capabilities

| Capability | Purpose |
|------------|---------|
| Categories | Browse by service/institution type |
| Search | Free-text / structured find |
| Filters | Narrow by category, verification, coverage, open status, etc. |
| Location | Physical address and/or map context |
| Availability information | Informational hours / presence cues (not a booking engine) |
| Verification status | Trust signal in results and detail |

### Visibility principles

1. Results are evaluated inside **Tenant Context** for tenant directory experiences.
2. Product rules decide which lifecycle states appear (e.g. only `verified`, or `verified` + limited unverified).
3. Official Entity Profiles may appear in distinct directory sections (official vs commercial) without merging profile types.
4. Ranking/featured placement may use verification and configuration — never Membership type as Permission substitute.

---

## Location vs Coverage

Discovery must distinguish **where a provider is based** from **where they serve**.

### Physical location

Optional or required per product rules:

```
Address → Territory → Community Area (optional)
```

Use for fixed premises (pharmacy, supermarket, town hall office).

Physical location inherits geographic meaning from ADR-004–006. It does not make Address a security boundary.

### Service coverage

Where the provider can serve customers:

| Coverage mode | Meaning |
|---------------|---------|
| Territory | Serves the whole Territory community |
| Area | Serves one or more Community Areas |
| Radius | Serves within a distance of a point/address |
| Custom coverage zones | Explicit polygons/zones or curated zone lists |

### Rules

1. A profile may have physical location, coverage, both, or (rarely) coverage-only when product allows external/mobile providers.
2. Coverage uses Territory/Area as **organizational discovery scope**, not as a new Tenant isolation root.
3. External providers based outside the Territory may still declare **coverage inside** the Tenant’s Territory.
4. Multiple coverage entries are allowed (e.g. several Areas + schedule metadata).
5. Availability information may annotate coverage (e.g. market day in an Area) without creating a bookings subsystem in this ADR.

---

## Verification

Aligned with ADR-016 lifecycle:

`draft` → `pending_verification` → `verified` → `suspended` → `archived`

### Directory behaviour

| Status | Typical directory effect |
|--------|--------------------------|
| `draft` | Not publicly listed |
| `pending_verification` | Hidden or limited “pending” views for claimants/admins only |
| `verified` | Eligible for standard/public trust listing |
| `suspended` | Removed from public discovery |
| `archived` | Not listed operationally |

### Trust vs authorization

- **Verification** → trust and listing eligibility.
- **RBAC** → who may create, claim, edit, verify, suspend profiles.
- Appearing in the directory never grants `roles.manage`, booking admin, or tenant admin capabilities.

Business Profiles: claim + review path.  
Official Entities: controlled verification before official trust treatment in directory and communications.

---

## Examples

### Example 1 — Local pharmacy

```
Business Profile: Farmacia Centro
  physical location: Address in Territory Life Panoramica (Area optional)
  coverage: Territory (or storefront walk-in)
  status: verified
```

### Example 2 — External locksmith

```
Business Profile: Alex Locksmith
  physical location: outside Territory (or none)
  service coverage: Territory Life Panoramica / selected Areas
  status: verified (after review)
```

Discoverable by residents; base of operations need not be inside the urbanization.

### Example 3 — Mobile fruit vendor

```
Business Profile: Fruta Móvil
  coverage: scheduled Areas (e.g. Aldea Golf Wed, Detinsa Sat)
  availability information: schedule metadata
  status: verified
```

### Example 4 — Town hall in directory

```
Official Entity Profile: Ayuntamiento
  status: verified
  directory section: Official
  physical location: Address in Territory
```

Distinct from commercial Business Profiles; same discovery substrate.

### Example 5 — What directory does not do

User finds locksmith in directory → may deep-link later to Bookings/Marketplace microapps.  
Directory itself does not complete payment or create commerce orders (those are separate workflows/ADRs).

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security boundary for tenant directory data and management |
| Profiles | Inherit platform security / Tenant Context (ADR-016) |
| Directory visibility | Product + verification; not a Permission grant |
| RBAC | Profile management and verification actions |
| Territory / Area / radius | Discovery and coverage scope only |
| Platform Core | Person links, Files (logos), Notifications, Audit, AuthZ |

### Evaluation order

```
Identity
  → Authentication (for managed/personalized actions)
  → Tenant Context (fail closed for tenant directory/management)
  → Authorization (management Permissions)
  → Discovery query (filters + verification + coverage)
```

Public read of verified listings may be allowed for authenticated community members (or broader audiences per product policy) but remains tenant-scoped by default and never bypasses isolation.

### Alignment statements

- Services microapp does not implement a second Person or RBAC system (ADR-015).
- Coverage outside physical Address does not create cross-tenant data access.
- Suspended/archived profiles must not remain effectively public through stale caches without policy controls (implementation concern).

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Define booking, payments, escrow, or checkout flows;
- Define full Marketplace commerce (catalog, cart, orders);
- Finalize category taxonomies or search ranking algorithms;
- Implement map providers or geocoding vendors;
- Define chat between seeker and provider;
- Replace Official Entity verification governance (ADR-016);
- Make directory listing an Authorization role;
- Hardcode Life Panoramica categories into platform architecture.

---

## Rejected Alternatives

### Directory as Person search

Rejected. Listings are Business / Official profiles (ADR-016 / ADR-010).

### Directory includes booking and payments

Rejected as this ADR’s scope. Discovery must remain separable from commerce microapps.

### Physical address required for all providers

Rejected. External and mobile providers need coverage without in-territory premises.

### Coverage Area as Tenant / RLS root

Rejected. Tenant remains isolation boundary; Area is organizational discovery scope.

### Unverified profiles always fully public

Rejected as default trust model. Verification status controls trust/listing eligibility.

---

## Related Domains

- ADR-016 Official Entities and Business Profiles Model
- ADR-014 Microapp Platform Architecture
- ADR-015 Platform Core Services Model
- ADR-013 Community Microapp Governance Model
- ADR-006 Physical Location Model
- ADR-005 Community Area Model
- ADR-012 Roles and Permissions Model
- Product: Services microapp, Directory, future Bookings/Marketplace

---

## Decision Rule

Until superseded, local service discovery must be implemented as a reusable Service Directory over Business and Official Entity Profiles, separating physical location from service coverage, using verification for trust, RBAC for management, and Tenant as security boundary — without embedding booking, payments or commerce into the discovery layer.
