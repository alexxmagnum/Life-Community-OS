# ADR-018 Incidents and Community Requests Model

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

Life Community OS needs a reusable operations microapp for community issues, requests and feedback.

ADR-013 defines Community governance concepts (announcements, surveys, votes, proposals, discussions) with Territory/Area content scope.

ADR-015 requires microapps to consume Platform Core (Person, Notifications, Audit, Files, RBAC) and not duplicate identity or notification systems.

ADR-012 requires Authorization via Roles and Permissions inside Tenant Context — not Membership type alone.

Open questions:

1. How are operational incidents and service requests modeled as a reusable microapp?
2. How do Territory vs Area scope apply to operations items?
3. How do reporters, assignees and observers participate without creating a new security boundary?
4. How do proposals relate to Community voting without merging microapps incorrectly?

This ADR defines the **Incidents and Community Requests Model**.

It does not create migrations or tables.

---

## Decision

**Incidents & Community Requests is a reusable microapp.**

It manages **operational communication** between community members, administrators and responsible entities.

It is not hardcoded to Life Panoramica and is not a separate SaaS.

### Core rules

1. **Incidents are not security boundaries.**
2. **Tenant remains the security boundary.**
3. **Area is organizational scope** (visibility/routing), not isolation.
4. **Permissions are handled by RBAC** (ADR-012).
5. **Uses Platform Core services** (Person, Notifications, Files, Audit, Membership context).
6. **Does not duplicate identity or notifications.**
7. Territory remains the main community isolation context for item ownership (via Territory → Tenant).

```
Platform Core
  ↑
Incidents & Community Requests microapp
  ├── Incident
  ├── Request
  ├── Complaint
  └── Suggestion / Proposal (operations intake; may link to Community governance)
```

---

## Domain Model

### Incident

A problem requiring attention.

Examples:

- maintenance issue;
- security issue;
- infrastructure problem.

### Request

A user-initiated request.

Examples:

- information request;
- service request;
- access request.

### Complaint

A dissatisfaction report about service, behaviour, or community conditions.

### Suggestion / Proposal

A community improvement initiative submitted through operations intake.

May remain in this microapp as tracked feedback, and/or link to **Community** microapp governance flows (discussion / voting) per ADR-013 — without merging the two microapps into one module.

### Shared item characteristics

All item types share conceptual traits:

- reporter (Person);
- optional assignee (Person, team, or responsible entity profile);
- optional observers;
- Territory scope (mandatory isolation path);
- optional Community Area scope;
- lifecycle status;
- comments, attachments, notifications, audit history.

Exact single-table vs typed-table persistence is deferred to implementation; the domain distinctions above remain.

---

## Lifecycle

Operational items follow an explicit lifecycle:

| Status | Meaning |
|--------|---------|
| `draft` | Being prepared by reporter; not yet in the queue |
| `submitted` | Submitted by reporter |
| `received` | Acknowledged by operations |
| `assigned` | Responsibility assigned |
| `in_progress` | Work underway |
| `resolved` | Solution applied / outcome reached |
| `closed` | Formally closed |
| `rejected` | Declined with reason |

### Lifecycle rules

1. Transitions are **Authorization-gated** (RBAC).
2. Not every type must use every status; product may constrain allowed transitions per type.
3. Prefer status history + Audit over silent overwrites.
4. `resolved` and `closed` are distinct: resolution can precede administrative closure.
5. Lifecycle status is **not** a Permission and **not** a Tenant boundary.

---

## Scope Model

Aligned with ADR-013 scope philosophy:

### Territory scope

Item applies to / is visible within the **whole Territory community** (subject to RBAC and privacy rules).

### Area scope

Item applies to / is primarily routed for a **specific Community Area**.

### Rules

| Rule | Requirement |
|------|-------------|
| Territory | Mandatory for tenant isolation path |
| Area | Optional organizational scope |
| Same Territory | If Area set, Area must belong to item Territory |
| Isolation | Always Tenant via Territory — never Area-as-tenant |
| Privacy | Some fields may be restricted to assignees/admins even within Territory scope |

```
Tenant (security boundary)
  └── Territory (isolation context)
        ├── Incident/Request (Territory scope)
        └── Community Area
              └── Incident/Request (Area scope)
```

---

## Roles and Responsibilities

These are **operational participation roles** on an item — not Security Platform Role records by themselves. Capabilities to act still require RBAC Permissions.

| Participant | Meaning |
|-------------|---------|
| **Reporter** | Person creating the item |
| **Assignee** | Person, team, or responsible entity accountable for handling |
| **Observers** | Users receiving updates (watchers) |

### Responsibility rules

1. Reporter is a Person (ADR-010) — not a User Account row as the domain actor.
2. Assignee may be a Person, an internal team construct, or a linked Business/Official profile where product allows — resolution of “team” persistence is deferred.
3. Observers receive Notifications via Platform Core; microapp does not build a parallel notification stack.
4. Assignment and status changes are Permission-gated (e.g. `incidents.assign`, `incidents.update_status`).
5. Membership type `resident` does not by itself allow assignment or closure.

### Capability surface

| Capability | Notes |
|------------|--------|
| Creation | Reporter creates draft/submitted items |
| Assignment | Authorized actors assign responsibility |
| Comments | Threaded operational communication |
| Attachments | Via Core Files / media references |
| Status tracking | Lifecycle transitions + history |
| Notifications | Via Core Notifications |
| Audit history | Via Core Audit |

---

## Examples

### Example 1 — Broken street light

```
Reporter: Resident (Person)
Item: Incident — Broken street light
Scope: Area Aldea Golf (Territory Life Panoramica)
Lifecycle: submitted → received → assigned → in_progress → resolved → closed
Assignee: Maintenance staff (Person) / maintenance team
Observers: Reporter + area admins
Notifications: status changes via Core
```

### Example 2 — Community proposal

```
Reporter: Resident
Item: Suggestion / Proposal — New recycling point
Scope: Territory
Path A: Tracked in Incidents microapp as feedback
Path B: Linked to Community discussion / optional voting (ADR-013)
```

Operations intake and Community governance remain separate microapps with an optional link.

### Example 3 — Information request

```
Item: Request — Hours of community office
Lifecycle: submitted → received → resolved → closed
Assignee: Community administrator
```

### Example 4 — Complaint

```
Item: Complaint — Noise after hours
Scope: Area
Privacy: limited visibility to assignees/admins per product policy
```

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary |
| Territory | Main isolation path for items |
| Community Area | Organizational scope / routing only |
| Incident/Request items | Not security boundaries |
| RBAC | Create, view, assign, comment, close, configure |
| Platform Core | Person, Notifications, Files, Audit |
| Membership | Participation context; not Authorization |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Microapp enablement (ADR-014)
  → Authorization (RBAC Permissions)
  → Item operation (scope Territory/Area)
  → Notifications + Audit (Core)
```

### Alignment statements

- RLS / data access for items must resolve through Territory → Tenant (defense in depth, ADR-003).
- Attachments inherit Tenant Context via Core Files.
- Cross-tenant incident sharing is out of default behaviour.
- Responsible “entity” assignees do not grant that entity Tenant-wide admin Permissions.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Define SLA timers, escalation matrices, or workforce management;
- Implement full ITIL/service-desk product parity;
- Replace Community voting/surveys (ADR-013);
- Define emergency dispatch or 112 integrations;
- Build a parallel chat or notification system;
- Make Area a Tenant or RLS root;
- Equate Assignee with Security Platform Role;
- Hardcode Panoramica maintenance teams into architecture.

---

## Rejected Alternatives

### Incidents hardcoded per customer

Rejected. Must be a reusable microapp (ADR-014).

### Incident as security boundary / Tenant Context

Rejected. Tenant remains isolation root.

### Duplicate Person / Notifications inside Incidents

Rejected (ADR-015).

### Membership type grants assign/close powers

Rejected (ADR-012).

### Merge all Community governance into Incidents

Rejected. Announcements/votes/discussions remain Community (ADR-013); optional links are allowed.

### Area-only items without Territory

Rejected. Territory path required for isolation.

---

## Related Domains

- ADR-013 Community Microapp Governance Model
- ADR-015 Platform Core Services Model
- ADR-014 Microapp Platform Architecture
- ADR-012 Roles and Permissions Model
- ADR-010 Person Identity Model
- ADR-003 Database Security and RLS Model
- ADR-016 Official Entities and Business Profiles Model (possible assignees)
- Product: Incidents microapp, Community governance links

---

## Decision Rule

Until superseded, community operational issues and requests must be implemented as a reusable Incidents & Community Requests microapp with Territory/Area scope, explicit lifecycle, reporter/assignee/observer participation, Core Notifications/Files/Audit, and RBAC Authorization — never as a security boundary or customer-specific fork.
