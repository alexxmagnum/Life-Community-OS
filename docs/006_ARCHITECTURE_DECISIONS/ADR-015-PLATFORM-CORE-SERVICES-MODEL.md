# ADR-015 Platform Core Services Model

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

Life Community OS is a multi-tenant SaaS platform composed of reusable microapps (ADR-014).

Microapps such as Community, Services and Incidents must share capabilities that must **not** be duplicated inside each module.

Existing decisions:

- **ADR-010** — Person is independent human identity; not User Account / Business / Official Entity;
- **ADR-011** — Membership is community participation, not Authorization;
- **ADR-012** — Roles and Permissions (RBAC) grant capabilities inside Tenant Context;
- **ADR-014** — Microapps are reusable modules on Platform Core with per-Tenant enablement.

Open questions:

1. What exact responsibilities belong to Platform Core vs microapps?
2. Which shared services must every microapp consume rather than reimplement?
3. How do Core services stay tenant-safe and reusable across all Tenants?

This ADR defines the **Platform Core Services Model**.

It does not create migrations or tables.

---

## Decision

Define **Platform Core** as the shared foundation consumed by all microapps.

### Core rules

1. **Microapps consume Core services.**
2. **Microapps do not duplicate identity** (Person / User Account linking).
3. **Microapps do not create independent permissions systems** (RBAC stays Core / Security Platform).
4. **Microapps inherit Tenant security** (Tenant Context, isolation, fail-closed behaviour).
5. **Core services are reusable across all Tenants** — not hardcoded to Life Panoramica or any single customer.
6. Microapps may own feature domain entities; they must not fork Core concepts (Tenant, Person, Membership, Roles, Files, Audit, etc.).

```
Platform Core Services
        ↑ consume
   Microapp Modules
        ↑ configured by
   Tenant Configuration
```

---

## Platform Core Boundaries

### Platform Core owns

| Area | Owns |
|------|------|
| Tenancy | Tenant lifecycle, Tenant Context contracts, isolation primitives |
| Identity | Person; User Account / Authentication Identity relationship |
| Participation | Membership (community participation) |
| Authorization | Roles, Permissions, Role Assignment evaluation model |
| Geography | Territory, Community Areas (and shared location primitives as established) |
| Communication | Notifications; messaging foundations |
| Storage | Files; media references |
| Operations | Audit logs; activity tracking foundations |
| Configuration | Tenant settings; feature / microapp configuration |
| Commercial | Plans, subscriptions, billing foundations |

### Microapps own

- Feature-specific domain entities and workflows (e.g. announcements, incident tickets, service listings);
- Microapp-declared Permissions consumed by Core RBAC;
- Microapp admin/member UI surfaces registered with the platform;
- Optional configuration schema **within** Tenant Configuration.

### Microapps must not own / duplicate

- Separate Person stores or login identity systems;
- Parallel RBAC engines or ad-hoc permission tables as the primary AuthZ model;
- Per-microapp tenancy roots;
- Independent audit pipelines that bypass Core Audit;
- Customer-specific forks of Core services.

### Boundary test

If a capability is required by **two or more microapps**, or is required for **tenant security / identity / billing**, it belongs in Platform Core unless an ADR explicitly places it in a microapp.

---

## Core Services

### Tenant Management

- Provision, status and configuration of SaaS Tenants;
- Tenant Context resolution contracts for requests/jobs;
- Enablement surface for microapps (with Microapp Registry — ADR-014).

### Identity

- **Person** — real human identity (ADR-010);
- **User Account relationship** — Authentication Identity linked to Person (Security Platform);
- No credentials stored as Person attributes.

### Membership

- Community participation Person ↔ Territory → Tenant (ADR-011);
- Participation classification only — not Permissions.

### Authorization

- **Roles** and **Permissions** (ADR-012);
- Evaluation inside Tenant Context (+ Security Policies);
- Microapp permission declarations register into Core AuthZ — they do not replace it.

### Geographic

- **Territory** — main community environment / isolation path;
- **Community Areas** — organizational geography (not security boundary).

### Communication

- **Notifications** — delivery substrate for Core and microapps;
- **Messaging foundations** — shared primitives for future messaging (not a full chat product in this ADR).

### Storage

- **Files** — upload/access patterns under Tenant Context;
- **Media references** — durable pointers/metadata for images and documents used by microapps.

### Operations

- **Audit logs** — security and administrative audit trail;
- **Activity tracking** — operational/product activity foundations for Core and microapps.

### Configuration

- **Tenant settings** — branding, locale, module defaults;
- **Feature configuration** — per-Tenant (and optional per-Territory) feature flags and microapp options.

### Commercial

- **Plans** — commercial offerings;
- **Subscriptions** — Tenant entitlement to plans/modules;
- **Billing foundations** — invoicing/payment integration boundaries (provider-replaceable).

Commercial Core gates **entitlement** (what a Tenant may enable). It does not replace RBAC for what a Person may do inside an enabled microapp.

---

## Microapp Interaction

### Consumption pattern

```
Microapp operation
  → resolve Tenant Context (Core)
  → confirm microapp entitlement/enablement (Core Configuration / Commercial)
  → authorize via RBAC Permissions (Core)
  → use Core services (Person, Membership, Notifications, Files, Audit, …)
  → execute microapp domain logic
  → persist under Tenant isolation
```

### Interaction rules

1. Microapps call Core APIs/contracts; they do not reach around Core for identity or AuthZ.
2. Microapps pass Tenant Context explicitly; Core services reject unbound tenant Business Data operations (fail closed).
3. Notifications, Files and Audit calls are attributed to Tenant Context and actor Identity/Person where applicable.
4. Microapps may extend metadata on Core entities only through approved extension points — not by altering Core meaning (e.g. Person remains human identity).
5. Cross-microapp workflows orchestrate through Core events/notifications where shared; they do not share writable domain tables casually across module boundaries without contracts.

---

## Examples

### Community Microapp

Uses:

- Person
- Membership
- Notifications
- (and RBAC, Territory/Area scope per ADR-013)

Does not invent its own user table or permission engine.

### Services Microapp

Uses:

- Person
- RBAC
- Files

Professionals/official listings attach to Core identity and storage; AuthZ remains Core.

### Incidents Microapp

Uses:

- Person
- Notifications
- Audit

Complaint/maintenance workflows notify and audit through Core; tenant isolation inherited.

### Shared Core across Tenants

```
Core Notifications service
  ├── Tenant A (Life Panoramica) Community alerts
  └── Tenant B (Acme Residences) Incident alerts
```

Same service implementation; isolated by Tenant Context.

---

## Security Alignment

| Concern | Core responsibility |
|---------|---------------------|
| Tenant isolation | Tenant Management + data access contracts + RLS alignment (ADR-003) |
| Person vs User Account | Identity services; no merge (ADR-010) |
| Participation vs AuthZ | Membership vs Roles/Permissions (ADR-011 / ADR-012) |
| Microapp safety | Inherit Tenant Context; declare Permissions; no shadow AuthZ |
| Auditability | Core Audit for security-relevant Core and microapp actions |
| Commercial entitlement | Plans/Subscriptions gate enablement; RBAC gates actions |

### Evaluation order

```
Identity / User Account
  → Authentication
  → Tenant Context (fail closed)
  → Entitlement / microapp enablement (Commercial + Configuration)
  → Authorization (Roles / Permissions)
  → Core service use + microapp domain operation
  → Audit
```

### Alignment statements

- Core services are multi-tenant by design; “no Tenant Context” is not a valid mode for tenant Business Data.
- Files and Notifications must not become cross-tenant channels.
- Billing foundations must not expose other Tenants’ commercial data.
- Service Role / privileged bypass remains exceptional and backend-only (ADR-003).

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Implement service runtimes, queues, or provider SDKs;
- Finalize notification channels, file storage vendors, or billing providers;
- Define the full Permission catalogue;
- Implement messaging/chat product UX;
- Move Community/Incidents/Services domain schemas into Core;
- Define SLA/SRE runbooks;
- Replace ADR-014 microapp registry details.

---

## Rejected Alternatives

### Each microapp implements Person / AuthZ / Files / Audit

Rejected. Causes inconsistency, security drift and duplicated tenancy bugs.

### Core as Panoramica-only shared library

Rejected. Core must be reusable across all Tenants.

### Microapp-local permission systems as primary AuthZ

Rejected (ADR-012 / ADR-014). RBAC remains Core / Security Platform.

### Commercial entitlement replaces RBAC

Rejected. Plans enable modules; Roles/Permissions authorize actors.

### Core owns all microapp feature entities

Rejected. Would recreate a monolith boundary and slow microapp evolution. Feature domains stay in microapps; shared foundations stay in Core.

---

## Related Domains

- ADR-014 Microapp Platform Architecture
- ADR-010 Person Identity Model
- ADR-011 Membership Community Participation Model
- ADR-012 Roles and Permissions Model
- ADR-013 Community Microapp Governance Model
- ADR-003 Database Security and RLS Model
- Security Platform: Identity, Authentication, Authorization, Audit
- Platform Architecture: Tenant Architecture

---

## Decision Rule

Until superseded, every shared capability required for identity, participation, authorization, tenancy, geography, notifications, files, audit, tenant configuration or commercial entitlement must live in Platform Core and be consumed by microapps — never reimplemented as a microapp-local parallel system.
