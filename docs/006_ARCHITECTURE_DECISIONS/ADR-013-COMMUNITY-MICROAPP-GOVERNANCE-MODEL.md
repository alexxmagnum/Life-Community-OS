# ADR-013 Community Microapp Governance Model

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

Life Community OS needs a reusable **Community** microapp.

The same capability must work for:

- urbanizations;
- residential communities;
- municipalities;
- neighborhoods;
- future territories and community shapes.

Life Panoramica is the first customer instance, not the product definition.

Existing decisions:

- **ADR-004** Community Geographic Model — Tenant → Territory → optional Community Area → Address;
- **ADR-005** Community Area Model — Area is organizational only, not a security boundary;
- **ADR-011** Membership — participation layer; Person remains independent;
- **ADR-012** Roles and Permissions — Membership ≠ Authorization; Permissions via RBAC inside Tenant Context;
- **ADR-002 / ADR-003** — Tenant is the isolation/security boundary; Territory is the community environment ownership path.

Open questions:

1. Is Community a Panoramica-specific module or a reusable microapp?
2. How is content scoped to a whole Territory vs a single Community Area?
3. How do announcements, surveys, votes, proposals and discussions relate as governance concepts?
4. How does visibility scope stay separate from Tenant isolation and RBAC?

This ADR defines the **Community Microapp Governance Model**.

It does not create migrations or tables.

---

## Decision

**Community is a reusable microapp.**

It is **not** hardcoded to Life Panoramica.

Community content is **scoped** for audience/visibility inside a Tenant’s Territory structure.

### Core rules

1. Community capabilities are productized once and configured per Tenant / Territory.
2. **Community Area is organizational scope, not a security boundary** (ADR-005).
3. **Tenant remains the security boundary** (ADR-002 / ADR-003).
4. **Territory remains the main community isolation context** for community Business Data (via Territory → Tenant).
5. **Permissions are handled through RBAC** (ADR-012) — not by Membership type alone and not by Area membership strings.
6. Content visibility scope (Territory vs Area) is a **governance/audience** concern; it does not invent a new tenancy model.

---

## Scope Model

Community content is published with an explicit visibility scope.

### Territory scope

Visible to the complete Territory community (all eligible participants under that Territory, subject to Authorization).

Use when the message or process applies community-wide.

### Area scope

Visible only inside a **Community Area** (organizational subdivision of the Territory).

Use when the message or process applies to a micro-urbanization, neighborhood, zone, or similar.

### Scope rules

| Rule | Requirement |
|------|-------------|
| Territory link | Community content is always territory-scoped for isolation (inherits Tenant via Territory) |
| Area link | Optional; when set, audience is limited to that Area for product visibility |
| Same Territory | If Area is set, Area must belong to the content’s Territory |
| No Area tenancy | Area scope never creates Tenant Context or RLS isolation root |
| Fail closed | Missing Tenant Context denies access; missing Permission denies action |

```
Tenant (security / isolation boundary)
  └── Territory (main community isolation context)
        ├── Community content (Territory scope) → all eligible in Territory
        └── Community Area (organizational)
              └── Community content (Area scope) → eligible in that Area only
```

---

## Community Capabilities

The Community microapp includes at least:

| Capability | Purpose |
|------------|---------|
| News and announcements | Official and operational communications |
| Events | Scheduled community happenings |
| Community calendar | Aggregated time view of community activity |
| Surveys | Opinion collection |
| Voting | Decision process |
| Proposals | Community-originated initiatives |
| Discussions | Conversation layer |

Capabilities are reusable across Tenants. Enablement and configuration may vary per Tenant / Territory without forking the microapp.

### Governance concepts

| Concept | Meaning |
|---------|---------|
| **Announcement** | Official communication from an authorized community/tenant voice |
| **Survey** | Opinion collection; not necessarily binding |
| **Vote** | Decision process with counted outcomes under defined rules |
| **Proposal** | Community-originated initiative that may enter review / vote / execution paths |
| **Discussion** | Conversation layer; may attach to announcements, proposals, events, or stand alone |

These are domain/governance concepts inside the Community microapp. They are not Membership types and not Security Platform Roles.

---

## Governance Lifecycle

Community governance artifacts share a conceptual lifecycle (exact statuses deferred to implementation):

```
Draft
  → Published / Open
    → Active (collecting responses / discussion)
      → Closed / Completed
        → Archived
```

### Concept-specific notes

| Concept | Lifecycle emphasis |
|---------|-------------------|
| Announcement | Draft → Published → (optional) Expired/Archived |
| Survey | Draft → Open → Closed → Results available → Archived |
| Vote | Draft → Open → Closed → Result certified/recorded → Archived |
| Proposal | Submitted → Under review → Accepted/Rejected/Withdrawn → (optional) Linked vote/execution → Archived |
| Discussion | Open → Locked → Archived |

Lifecycle transitions are **Authorization-gated** via RBAC Permissions (ADR-012), evaluated inside Tenant Context.  
Territory vs Area scope affects **who can see** the artifact, not which Tenant owns it.

---

## Examples

### Example 1 — Territory announcement

```
Tenant: Life Panoramica
Territory: Life Panoramica
Scope: Territory
Announcement: "Water maintenance tomorrow"
Visible: all eligible Life Panoramica participants
```

### Example 2 — Area announcement

```
Tenant: Life Panoramica
Territory: Life Panoramica
Community Area: Aldea Golf
Scope: Area
Announcement: "Pool meeting"
Visible: Aldea Golf only (eligible participants)
```

### Example 3 — Same microapp, different Territory shape

```
Tenant: Coastal Town OS
Territory: Municipality North
Capabilities: announcements, surveys, voting, proposals
```

No Panoramica-specific code paths required for the microapp to function.

### Example 4 — Permissions vs scope

```
Person: Elena
  Membership: Life Panoramica (participation)
  Role: community_admin
  Permission: announcements.publish

Elena may publish:
  - Territory-scoped announcements (if permitted)
  - Area-scoped announcements for Areas in that Territory (if permitted)
```

Having Area scope on content does not grant Elena cross-tenant access.  
Lacking `announcements.publish` denies publish even with Membership.

---

## Security Alignment

| Concern | Model |
|---------|--------|
| Tenant | Security / isolation boundary for Community Business Data |
| Territory | Main community isolation context (ownership path to Tenant) |
| Community Area | Organizational visibility scope only |
| Membership | Participation; not Authorization (ADR-011) |
| RBAC (Roles / Permissions) | Capabilities for publish, vote, moderate, configure (ADR-012) |
| RLS | Enforces Tenant via Territory path; not Area-as-tenant |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Authorization (RBAC Permissions)
  → Community domain operation
  → Visibility filter (Territory scope vs Area scope)
  → Persistence under Territory → Tenant isolation
```

### Alignment statements

- Community Area visibility **never** replaces Tenant Context.
- Area-scoped rows still store / inherit **Territory** for isolation.
- Microapp reuse must not embed Life Panoramica identifiers in platform architecture.
- Service Role and platform ops remain constrained by ADR-003.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Hardcode Life Panoramica structures into the Community microapp;
- Make Community Area a Tenant or RLS isolation root;
- Define full notification, feed ranking, or UI layouts;
- Define vote cryptography, quorum formulas, or legal election compliance;
- Replace RBAC with Membership types;
- Define Business Profile or Official Entity community feeds (may consume Community later);
- Implement realtime chat infrastructure;
- Finalize content schemas for each capability.

---

## Rejected Alternatives

### Community hardcoded for Life Panoramica

Rejected. Must reuse across urbanizations, municipalities, neighborhoods and future Territories.

### Area as security boundary / Tenant Context

Rejected (ADR-005). Area is organizational visibility only.

### Membership type grants all Community permissions

Rejected (ADR-011 / ADR-012). Permissions remain RBAC.

### Territory-only content (no Area scope)

Rejected as the only model. Area-scoped communications are required for micro-urbanizations (e.g. Aldea Golf pool meeting).

### Separate tenancy per Community Area

Rejected. Breaks SaaS Tenant isolation model and multi-area operators.

---

## Related Domains

- ADR-004 Community Geographic Model
- ADR-005 Community Area Model
- ADR-011 Membership Community Participation Model
- ADR-012 Roles and Permissions Model
- ADR-002 Tenant Isolation Model
- ADR-003 Database Security and RLS Model
- Product: Community microapp, announcements, governance
- Reference: Life Panoramica as first tenant instance — not product hardcoding

---

## Decision Rule

Until superseded, Community must be implemented as a reusable microapp with Territory- and Area-scoped content visibility, Tenant as security boundary, Territory as main community isolation context, Community Area as organizational scope only, and all capability grants through RBAC — never hardcoded to a single customer.
