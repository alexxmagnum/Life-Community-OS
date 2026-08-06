# ADR-034 Community Governance and Administration Model

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

Community requires **configurable governance and administration** for different Tenant types (residential communities, municipalities, resorts, clubs, organizations).

ADR-012 establishes Roles and Permissions (RBAC) as the Authorization model inside Tenant Context — Membership is not Authorization.

ADR-025 defines Community as a reusable microapp consuming Platform Core.

ADR-033 provides contextual Community Profiles without replacing Person.

ADR-021 requires immutable Audit for privileged administrative and moderation actions.

Open questions:

1. How are Community governance responsibilities expressed without a parallel permission system?
2. How does delegation work across Territory, Area and Group scopes?
3. What do Tenant configuration and Audit require for safe administration?

This ADR defines the **Community Governance and Administration Model**.

It does not create migrations or tables.

---

## Decision

**Community governance uses Platform RBAC** and provides **configurable administrative responsibilities**.

There is **no parallel authorization model** inside Community.

### Core rules

1. **Membership is participation, not permission** (ADR-011 / ADR-012).
2. **RBAC controls capabilities** (publish official content, moderate, manage resources, configure Community, etc.).
3. **Tenant remains the security boundary.**
4. **Territory/Area define organizational scope** for delegated administration (and Groups where configured — ADR-029).
5. **No parallel authorization model** (no Community-only ACL engine as source of truth).
6. Governance roles are Role Assignments (and/or permission sets) evaluated by Security Platform AuthZ inside Tenant Context.
7. Administrative actions are auditable (ADR-021) and may emit Notifications (ADR-019).

```
Platform RBAC (Roles / Permissions / Assignments)
        ↑ only AuthZ path
Community governance responsibilities
        ↓ scoped by
Tenant → Territory → Area → Group (organizational)
```

---

## Governance Roles

Governance roles are **packaged RBAC roles** (names illustrative; exact catalogue is configuration):

| Role (example) | Typical responsibility |
|----------------|------------------------|
| `tenant_owner` / platform-equivalent | Highest Tenant admin (often Core-wide, not Community-only) |
| `community_admin` | Configure Community microapp, manage broad community settings |
| `communications_publisher` | Official announcements / news publishing |
| `moderator` | Moderate discussions, recommendations, profiles interactions |
| `events_organizer` | Experiences/events/meetings management |
| `resources_manager` | Resources & reservations administration |
| `area_coordinator` | Delegated admin within a Community Area |
| `group_admin` | Delegated admin within a Community Group |
| `auditor_readonly` | View Community audit/activity surfaces if entitled |

### Role rules

1. Role labels are not Membership types and not Person subtypes.
2. Tenants enable/customize which Community roles exist within plan entitlement (ADR-023 / ADR-024) — they do not invent a second AuthZ runtime.
3. Assigning `community_admin` does not bypass Tenant isolation or Platform Context rules.
4. Multiple roles may be assigned to one Person via Role Assignments.

---

## Delegation Model

Delegation grants **scoped administrative responsibility** without transferring Tenant ownership.

### Delegation principles

1. A higher-privilege admin may assign Community roles to Persons **within Tenant Context** if they hold assign Permissions.
2. Delegation may be **resource-scoped** (Territory-wide, Area-limited, Group-limited, or feature-limited).
3. Delegates receive only the Permissions in the assigned role — not implicit superuser.
4. Revocation is immediate for AuthZ evaluation; caches must not preserve stale admin powers.
5. Delegation changes are auditable.

### Non-transferable powers (examples)

Unless explicitly entitled by RBAC:

- billing management for the Tenant organization (ADR-024);
- cross-tenant operations;
- granting `tenant_owner`-equivalent powers without proper Permission;
- disabling Audit.

---

## Administrative Scopes

| Scope | Meaning |
|-------|---------|
| **Tenant** | Whole Tenant Community configuration and cross-territory admin where Tenant has multiple Territories |
| **Territory** | Main community environment administration |
| **Area** | Local coordinator powers for an Area’s content/resources |
| **Group** | Circle/committee administration (ADR-029) |
| **Feature** | Only announcements, or only resources, or only moderation, etc. |

### Scope rules

1. Scopes are organizational constraints on Role Assignment evaluation — **not** new security boundaries.
2. Area/Group admin cannot access other Areas/Groups unless also assigned.
3. Missing Tenant Context fails closed.
4. Scope never replaces RLS Tenant isolation path for data access.

---

## Microapp Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Platform Core / Security Platform** | RBAC evaluation, Tenant Context, Audit, Notifications, Membership, Person |
| **Community microapp** | Declares Community Permissions/roles needs; implements governed features; enforces AuthZ decisions; does not store a rival permission graph as authority |
| **Tenant Configuration** | Which Community features/roles are enabled; moderation policies; required review workflows (ADR-023 / ADR-026) |

Community may present an admin UI (“Community Admin Panel”) that **calls Core AuthZ** — UI is not the authorization engine.

---

## Moderation

Moderation is a governance function over Community content and interactions (ADR-026 / ADR-028 / ADR-032).

### Moderator capabilities (Permission-gated)

- approve/reject pending content;
- hide/remove comments and recommendations;
- lock threads;
- restrict abusive actors’ Community interaction Privileges within Tenant policy;
- act on reports.

### Moderation rules

1. Moderators are RBAC assignees — not “Membership = staff” shortcuts.
2. Moderation is Tenant-scoped (optionally Area/Group-scoped).
3. Escalation to `community_admin` / Official Entity contacts is product workflow, still AuthZ-gated.
4. Moderation actions append Audit Events; significant ones may notify via Core.

---

## Tenant Configuration

Governance is configurable per Tenant type without code forks:

| Configuration area | Examples |
|--------------------|----------|
| Enabled Community features | announcements, voting, resources, recommendations |
| Required review | proposals always `pending_review` |
| Role catalogue exposure | which governance roles are assignable |
| Default scopes | Area coordinators enabled for urbanization Tenants |
| Retention / export policies | admin visibility of profiles/reports |
| Official publishing rules | who may use official voice |

### Configuration rules

1. Configuration controls **availability and policy**, not Permissions themselves (ADR-023).
2. Configuration changes for governance are RBAC-gated and auditable.
3. Disabled admin features must not expose APIs.
4. Residential vs municipality vs resort differences are configuration/packaging — same governance model.

---

## RBAC Alignment

### Evaluation order (unchanged)

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community feature enabled?
  → Authorization (Role Assignment → Permissions, with admin scope constraints)
  → Membership eligibility when required for the action
  → Domain admin/moderation operation
  → Audit (+ Notifications as needed)
```

### Alignment statements

| Concern | Model |
|---------|--------|
| Membership type `administrator` | Participation classification only — **not** AuthZ |
| Community Profile | Presentation — **not** admin authority (ADR-033) |
| Group admin label | Must map to RBAC Permissions to be effective |
| Parallel Community ACL tables as source of truth | **Forbidden** |
| RLS | Isolation; does not replace admin AuthZ |

---

## Audit Alignment

Privileged governance actions must emit immutable Audit Events (ADR-021), including at least:

- role assignments / revocations for Community governance;
- configuration changes affecting moderation/publishing policies;
- official publish actions;
- moderation removals / locks / privilege restrictions;
- resource policy overrides and force-book style actions (ADR-031);
- exports of sensitive member lists when product allows.

### Audit rules

1. Activity feeds may show safe admin summaries; Audit remains source of truth.
2. Viewing full Community audit consoles requires explicit Permissions.
3. Automation that auto-moderates must run as system actor under Tenant Context and still audit.

---

## Examples

### Example 1 — Urbanization governance

```
Tenant: Life Panoramica
community_admin: Elena
area_coordinator (Aldea Golf): Marco
Marco can moderate Aldea Golf discussions / local resources
Cannot publish Territory-wide official announcements without Permission
```

### Example 2 — Municipality packaging

```
Same RBAC model
Configuration enables Area coordinators for districts
Official publishing limited to communications_publisher role
```

### Example 3 — Delegation

```
community_admin assigns events_organizer to Ana
Ana manages experiences/events
Cannot manage billing or Tenant roles beyond granted assign scope
Audit: role.assigned
```

### Example 4 — Membership is not permission

```
Membership type: resident
Without Role Assignment: can participate per member Permissions only
Cannot access Community Admin Panel
```

### Example 5 — No parallel AuthZ

```
Community Admin UI checks Core Permission community.configure
No local "isAdmin" boolean on Community Profile as authority
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Finalize the global Permission key catalogue;
- Implement political governance / legal board election systems;
- Replace Tenant-owner / billing administration (Core commercial);
- Define HR org charts;
- Allow Community to ship a separate OAuth/ACL product;
- Make Area/Group into Tenants;
- Equate Community Profile badges with admin Roles.

---

## Rejected Alternatives

### Membership type as authorization

Rejected (ADR-011 / ADR-012).

### Community-local permissions engine as source of truth

Rejected. Parallel AuthZ forbidden; Platform RBAC only.

### Area coordinator as security boundary / Tenant Context

Rejected. Organizational scope only.

### Unaudited admin role changes

Rejected (ADR-021).

### Hardcoded Panoramica org chart in code

Rejected (ADR-014 / ADR-023). Use configurable roles/scopes.

---

## Related Domains

- ADR-012 Roles and Permissions Model
- ADR-025 Community Microapp Domain Model
- ADR-033 Community Identity Profiles and Presence Model
- ADR-021 Audit and Activity Tracking Model
- ADR-026 Community Content Publishing Model
- ADR-028 Community Participation and Social Interaction Model
- ADR-029 Community Groups and Circles Model
- ADR-031 Community Resources and Reservations Model
- ADR-011 Membership Community Participation Model
- ADR-023 Configuration and Feature Management Model
- ADR-024 Billing and Plans Model
- ADR-003 Database Security and RLS Model

---

## Decision Rule

Until superseded, Community administration and governance must be expressed exclusively through Platform RBAC Role Assignments and Permissions, optionally scoped by Territory/Area/Group/feature configuration, with Membership as participation only, Tenant as security boundary, Audit on privileged actions, and no parallel authorization model inside the Community microapp.
