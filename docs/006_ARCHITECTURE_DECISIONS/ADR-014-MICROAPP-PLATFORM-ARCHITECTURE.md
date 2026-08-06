# ADR-014 Microapp Platform Architecture

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

Life Community OS is a multi-tenant SaaS platform.

The product is composed of reusable **microapps**.

Examples:

- Community
- Services
- Incidents
- Events
- Bookings
- Directory
- Marketplace

Existing decisions:

- **ADR-003** — Tenant isolation and RLS; Tenant is the security boundary for Business Data;
- **ADR-011** — Membership is community participation, not Authorization;
- **ADR-012** — Roles and Permissions (RBAC) grant capabilities inside Tenant Context;
- **ADR-013** — Community is a reusable microapp with Territory/Area content scope, not hardcoded to Life Panoramica.

Open questions:

1. What is shared platform core vs microapp-owned domain?
2. How do Tenants enable/disable capabilities without forking the product?
3. How do microapp admin UIs and permissions stay tenant-safe and reusable?

This ADR defines the **Microapp Platform Architecture**.

It does not create migrations or tables.

---

## Decision

**Microapps are reusable platform modules.**

A Tenant can enable or disable microapps according to their needs.

Microapps **share the platform core**; they are not separate SaaS products.

### Architecture

```
Platform Core
      |
      +-- Microapp Registry
      |
      +-- Microapp Modules
      |
      +-- Tenant Configuration
```

### Microapp rules

1. A microapp is **not** a separate SaaS.
2. A microapp is **not** hardcoded to a specific Tenant (including Life Panoramica).
3. A microapp **inherits tenant security** (Tenant Context + RLS + RBAC).
4. A microapp can define its **own domain entities**.
5. A microapp can define its **own admin interface**.
6. **Permissions are handled through RBAC** (ADR-012).

---

## Platform Core

Shared foundation used by every microapp.

### Core capabilities

| Capability | Role in the platform |
|------------|----------------------|
| Tenant | SaaS customer / isolation and commercial root |
| Territory | Main community environment / isolation path |
| Community Areas | Optional organizational geography |
| Person | Independent human identity |
| Membership | Community participation |
| Roles | Capability bundles |
| Permissions | Atomic capabilities |
| Notifications | Cross-app messaging / alerts substrate |
| Files | Shared file/object handling substrate |
| Audit | Security and operational audit substrate |

### Core responsibilities

- Identity, Authentication and Authorization boundaries (Security Platform);
- Tenant Context resolution and fail-closed isolation;
- Shared domain primitives (Person, Membership, Territory, Area, Address, Property where applicable);
- Microapp registry and tenant enablement configuration;
- Cross-cutting Notifications, Files and Audit services;
- Consistent multi-tenant data access patterns (application scoping + RLS).

Microapps consume Core; they do not re-implement tenancy, Person identity, or RBAC engines.

---

## Microapp Model

### What a microapp is

A versioned, reusable module that:

- registers with the **Microapp Registry**;
- declares dependencies on Core capabilities;
- owns optional domain entities and workflows;
- exposes member-facing and/or admin-facing surfaces;
- declares Permissions (and optionally Roles) for RBAC;
- can be enabled per Tenant (and optionally configured per Territory).

### What a microapp is not

- A separate database tenancy product;
- A customer-specific fork (e.g. “Panoramica Community only”);
- A replacement for Tenant isolation;
- A place to embed Membership-as-permission shortcuts;
- A bypass of Authentication / Authorization / Audit.

### Domain ownership

| Layer | Owns |
|-------|------|
| Platform Core | Tenant, Territory, Area, Person, Membership, Roles/Permissions model, Notifications, Files, Audit |
| Microapp | Its feature entities (e.g. announcements, incidents, listings) and microapp workflows |
| Tenant Configuration | Which microapps are enabled and how they are configured |

Community (ADR-013) is one microapp under this model; Services, Incidents, Events, Bookings, Directory and Marketplace follow the same pattern.

---

## Tenant Enablement

### Microapp Registry

Platform catalogue of available microapps (identity, version, capabilities, permission declarations, admin entry points).

### Tenant Configuration

Per-Tenant (and optionally per-Territory) settings that:

- enable / disable microapps;
- configure feature flags inside an enabled microapp;
- bind branding/navigation entry points;
- do **not** create a new security boundary.

### Example enablement

```
Tenant: Life Panoramica

Enabled:
  Community:
    - announcements
    - voting
    - proposals
  Services:
    - professionals
    - official entities
  Incidents:
    - complaints
    - maintenance requests
```

Another Tenant may enable only Community + Directory. Same modules; different configuration.

### Rules

1. Disabled microapps are unavailable for that Tenant’s users (UX and Authorization both deny).
2. Enablement does not grant all Permissions automatically — Role Assignment still required (ADR-012).
3. Data for a disabled microapp remains tenant-isolated; retention/archival policy is operational, not a tenancy change.

---

## Permissions

Authorization remains Security Platform RBAC (ADR-012).

### Patterns

| Pattern | Example |
|---------|---------|
| Core / tenant-level | `tenant.configuration.manage`, `roles.manage` |
| Microapp-specific | `community.announcements.publish`, `incidents.manage` |
| Future business/official scopes | Business Profile / Official Entity permissions (ADR-012) |

### Rules

1. Microapps **declare** Permissions; Core **evaluates** them inside Tenant Context.
2. Membership type never substitutes for microapp Permissions (ADR-011 / ADR-012).
3. Microapp admin actions require explicit Permissions.
4. Cross-microapp actions need explicit Permissions (or a Tenant-level role that includes them) — no implicit “enabled app = full access”.

---

## Admin Panels

Each microapp may provide its **own admin interface**.

### Rules

1. Admin panels are Tenant-scoped (and may further filter by Territory / Area for organization — not for tenancy).
2. Admin entry points are registered via the Microapp Registry and shown only when the microapp is enabled **and** the actor has required Permissions.
3. Admin UIs must not use Service Role in clients; privileged operations remain backend-governed (ADR-003).
4. Shared admin shell (navigation, tenant switcher, audit cues) lives in Platform Core; microapp pages plug in.
5. Customer-specific admin screens are configuration/content, not hardcoded module forks.

---

## Examples

### Example 1 — Life Panoramica configuration

```
Platform Core
  └── Tenant: Life Panoramica
        ├── Microapps enabled: Community, Services, Incidents
        ├── Community: announcements, voting, proposals
        ├── Services: professionals, official entities
        └── Incidents: complaints, maintenance requests
```

### Example 2 — Smaller Tenant

```
Tenant: Acme Residences
  └── Enabled: Community (announcements only), Directory
```

Same Community microapp; fewer features enabled.

### Example 3 — Permission gate

```
Microapp: Incidents enabled for Tenant
Person: Member without incidents.manage
Result: can submit allowed member actions only; cannot access incident admin
```

### Example 4 — Reuse across geography types

Community microapp serves urbanization Tenants and municipality Tenants alike (ADR-013), using Territory/Area scope — not separate SaaS products.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for all microapp Business Data |
| Territory / Area | Organizational and content scope; Area not isolation root |
| Membership | Participation only |
| RBAC | Capability grants for Core and microapps |
| RLS | Defense in depth on persistence; inherits Tenant via Territory paths |
| Microapp | Inherits Tenant Context; never bypasses AuthN/AuthZ/Audit |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Tenant microapp enablement check
  → Authorization (RBAC Permissions)
  → Microapp domain operation
  → Persistence under Tenant isolation
```

### Alignment statements

- Enabling a microapp does not weaken RLS.
- Microapp domain tables must be tenant-scoped through approved ownership paths (typically Territory / Tenant-linked parents).
- Notifications, Files and Audit remain Core services usable by microapps under the same Tenant Context.
- Life Panoramica is a Tenant configuration instance, not architecture.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Implement the Microapp Registry runtime;
- Finalize the full microapp catalogue or permission taxonomy;
- Define marketplace billing or third-party microapp signing;
- Define UI design systems for each admin panel;
- Split each microapp into an independent SaaS database;
- Hardcode Life Panoramica feature sets into Core;
- Replace ADR-012 RBAC with per-microapp ad-hoc ACL tables as the primary model;
- Define offline/PWA packaging per microapp.

---

## Rejected Alternatives

### One monolith module per customer

Rejected. Prevents reuse across urbanizations, municipalities and future Tenants.

### Microapp = separate SaaS / separate tenancy product

Rejected. Breaks shared Core, shared Person/Membership, and unified Tenant isolation.

### Enablement implies full admin access

Rejected. RBAC still required (ADR-012).

### Hardcode Community to Life Panoramica

Rejected (ADR-013). Panoramica is configuration, not the module.

### Each microapp implements its own auth and tenancy

Rejected. Security and tenancy remain Platform Core / Security Platform concerns.

---

## Related Domains

- ADR-003 Database Security and RLS Model
- ADR-011 Membership Community Participation Model
- ADR-012 Roles and Permissions Model
- ADR-013 Community Microapp Governance Model
- ADR-002 Tenant Isolation Model
- Platform Architecture: Tenant Architecture
- Product: microapps catalogue, tenant administration

---

## Decision Rule

Until superseded, every feature module must be delivered as a reusable microapp that shares Platform Core, is enableable per Tenant, inherits Tenant security and RBAC, and must not be implemented as a customer-specific or separate-SaaS fork.
