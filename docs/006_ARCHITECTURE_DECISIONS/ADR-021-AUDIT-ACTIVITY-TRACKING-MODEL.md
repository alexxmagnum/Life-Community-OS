# ADR-021 Audit and Activity Tracking Model

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

Life Community OS is a multi-tenant SaaS platform with many actors and microapps.

The platform requires traceability of actions, changes and system events across Community, Services, Incidents, Core identity/authorization, Files and future modules.

ADR-015 places **Audit logs** and **activity tracking** in Platform Core and forbids microapp-local parallel operational foundations.

ADR-012 requires Authorization via RBAC inside Tenant Context — including who may view sensitive audit information.

ADR-020 requires security-relevant file operations to be auditable through Core.

Open questions:

1. What is immutable technical audit vs human-facing activity?
2. How do microapps emit audit events without owning audit stores?
3. How is Tenant isolation enforced for audit/activity data?
4. What must be captured for human and system actions?

This ADR defines the **Audit and Activity Tracking Model**.

It does not create migrations or tables.

---

## Decision

**Audit & Activity Tracking is a Platform Core service.**

- **Audit** records **immutable history**.
- **Activity** provides a **human-readable** view of relevant recent actions.

### Core rules

1. **Microapps consume Audit Core.**
2. **Microapps do not create independent audit systems.**
3. **Audit is immutable** (no silent rewrite of historical facts; corrections are new events).
4. **Tenant remains the security boundary** for tenant-scoped audit/activity.
5. **RBAC controls who can view audit information** (and any export/admin tooling).
6. Activity is derived/projected from audit (and selective domain events); it is not a second source of truth that can diverge undetected.
7. Life Panoramica uses the same Core Audit service as any other Tenant.

```
Microapps + Core services
        │ emit audit events
        ▼
Platform Core — Audit (immutable)
        │ project / filter
        ▼
Activity (user-facing recent actions)
```

---

## Audit Model

### Audit Event

A **technical record of an action** — the authoritative history entry.

### Captured fields (conceptual)

| Field | Purpose |
|-------|---------|
| `actor` | Who/what performed the action (Person and/or User Account / system actor) |
| `action` | What happened (namespaced action key) |
| `entity_type` | Domain type affected |
| `entity_id` | Stable id of the affected entity |
| `timestamp` | When the action was recorded |
| `tenant_context` | Active Tenant (required for tenant Business Data actions) |
| `metadata` | Extensible context (request id, microapp, channel, …) |
| `before` / `after` | Change snapshots when applicable |

Exact persistence schema is deferred to migration design; field intent above is normative.

### Immutability

1. Audit Events are append-only.
2. Edits to history are forbidden; compensating actions emit new Audit Events.
3. Retention/archival may move storage tier but must not alter event meaning.
4. Deletion of audit history (if ever legally required) is a governed platform operation with its own audit trail — not a microapp feature.

### Emission pattern

```
Authorized domain action commits
  → producer emits Audit Event to Core
  → Core validates Tenant Context + schema
  → Core appends immutable event
  → optional Activity projection update
```

Producers include microapps and other Core services (Notifications, Files, Authorization admin, Commercial, etc.).

---

## Activity Model

### Activity

A **user-facing representation** of relevant actions — timelines, “recent changes”, member feeds of allowed events.

Characteristics:

- curated/filtered for humans;
- may omit sensitive technical fields (secrets, full before/after dumps);
- may aggregate or localize action labels;
- always constrained by Tenant Context and the viewer’s Permissions;
- not a substitute for Audit when investigating security incidents.

### Audit vs Activity

| Concern | Audit Event | Activity |
|---------|-------------|----------|
| Audience | Security, ops, compliance, admins | End users / operators in product UX |
| Mutability | Immutable | Projected; can be rebuilt from Audit |
| Completeness | Prefer complete technical trail | Prefer relevant, readable subset |
| Sensitivity | May contain detailed before/after | Redacted / summarized |
| Authority | Source of truth for “what happened” | Convenience view |

### Rules

1. If Activity and Audit disagree, **Audit wins**; rebuild Activity.
2. Microapps may suggest activity categories/templates; Core owns storage and access enforcement for the shared activity stream unless an ADR explicitly allows a local UX cache.
3. “Hide from activity feed” never deletes Audit Events.

---

## Events

### Human actions (examples)

| Action | Typical meaning |
|--------|-----------------|
| `create` | Entity created |
| `update` | Entity changed |
| `delete` | Entity removed / soft-deleted |
| `approve` | Approval granted |
| `reject` | Approval denied |
| `publish` | Content published |
| `assign` | Responsibility assigned |
| `close` | Item closed |

Action keys should be namespaced in implementation (e.g. `incidents.assign`, `profiles.verify`) while remaining aligned to these verbs.

### System actions (examples)

| Action | Typical meaning |
|--------|-----------------|
| `notification.sent` | Notification delivery attempted/recorded |
| `automation.executed` | Automation/job ran |
| `file.processed` | File preview/scan/derivation completed |

System actors must be explicit in the Audit Event (service identity / job id), not impersonate a Person silently.

### Change capture

Use `before` / `after` when the action mutates meaningful state (status transitions, role assignments, verification state).  
Avoid storing secrets (passwords, raw provider keys, signed URL tokens) in audit payloads.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security boundary; tenant-scoped audit/activity isolated |
| Audit | Immutable; append-only |
| Activity | User-facing; Permission-filtered |
| RBAC | Controls who can view full audit vs activity feeds |
| Microapps | Emit to Core; no independent audit DB as source of truth |
| Cross-tenant | Forbidden by default |
| Files / Notifications | Security-relevant operations emit Audit Events (ADR-019 / ADR-020) |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Authorization for domain action
  → Domain commit
  → Audit append (Core)
  → Activity projection (Core)
  → Authorization for audit/activity read (separate Permissions)
```

### Alignment statements

- Viewing audit is itself an auditable privileged action when product requires.
- Membership type never grants audit export rights (ADR-011 / ADR-012).
- Platform Context / Service Role operations that touch tenant data must still record Tenant Context on Audit Events (ADR-003 alignment).
- Automation and AI executions that mutate tenant data must emit Audit Events under Tenant Context (ADR-002 alignment).

---

## Examples

### Example 1 — Business verification

```
Business Profile status: pending_verification → verified
Audit Event:
  actor: verifier Person / admin Identity
  action: approve / profiles.verify
  entity_type: business_profile
  before.status: pending_verification
  after.status: verified
  tenant_context: Life Panoramica
Activity: "Business profile verified"
```

### Example 2 — Role change

```
Role Assignment change affecting community capabilities
  (not Membership type rename alone)
Audit Event:
  action: update (roles.assign / roles.revoke)
  before/after: role identifiers
Activity (if permitted): "Administrator role granted"
```

Note: Membership participation type changes may also be audited, but Authorization role changes are RBAC Audit Events (ADR-012), not Membership-as-permission.

### Example 3 — Incident lifecycle

```
Incident: created → … → resolved
Audit Events for create, assign, status transitions, resolve
Activity for reporter/assignees: readable status updates
Notifications may fire (ADR-019) and record notification.sent
```

### Example 4 — File processing

```
System action: file.processed
actor: files-worker
entity: physical_file id
tenant_context: required
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Choose analytics warehouses or SIEM vendors;
- Define full retention schedules per jurisdiction;
- Implement product analytics / funnel tracking as a substitute for Audit;
- Make Activity a writable second ledger;
- Define UI layouts for audit consoles;
- Require before/after on every read-only access (optional access-audit is a later policy choice);
- Allow microapps to “patch” historical audit rows.

---

## Rejected Alternatives

### Per-microapp audit tables as source of truth

Rejected (ADR-015). Fragmented, inconsistent, easy to bypass.

### Mutable audit rows (“update the history”)

Rejected. Breaks forensic integrity.

### Activity feed as the only log

Rejected. Too lossy for security and compliance.

### Audit visible to all Members by default

Rejected. RBAC must gate sensitive audit access (ADR-012).

### Audit without Tenant Context for tenant Business Data

Rejected. Breaks isolation (ADR-002 / ADR-003).

---

## Related Domains

- ADR-015 Platform Core Services Model
- ADR-012 Roles and Permissions Model
- ADR-020 Files and Media Management Model
- ADR-019 Notifications and Communication Model
- ADR-014 Microapp Platform Architecture
- ADR-003 Database Security and RLS Model
- ADR-002 Tenant Isolation Model
- Security: Audit, Observability, Compliance

---

## Decision Rule

Until superseded, all significant human and system actions affecting tenant Business Data or security-sensitive Core operations must append immutable Audit Events through Platform Core; Activity views must be projections under RBAC; and no microapp may implement an independent audit system as source of truth.
