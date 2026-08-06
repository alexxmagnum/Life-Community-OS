# ADR-025 Community Microapp Domain Model

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

**Community** is a reusable microapp providing social participation and communication capabilities across Tenants.

ADR-013 established Community as a reusable governance/microapp capability with Territory vs Area content scope, and distinguished announcements, surveys, votes, proposals and discussions.

ADR-014 / ADR-015 require microapps to share Platform Core, inherit Tenant security, and not hardcode customer-specific forks (including Life Panoramica).

ADR-011 establishes Membership as community participation; Person remains independent; Membership is not Authorization.

Open questions:

1. What is the Community microapp domain feature set for Foundation productization?
2. How do content lifecycle and participation attach to Core identity, Membership and RBAC?
3. How do Territory/Area scope and Tenant isolation apply across Community features?

This ADR defines the **Community Microapp Domain Model**.

It does not create migrations or tables.

---

## Decision

**Community is a reusable microapp, not tenant-specific.**

It provides:

- announcements;
- news;
- meetings;
- calendar;
- polls;
- voting;
- proposals;
- discussions;
- experiences.

### Core rules

1. **Community consumes Platform Core services** (Person, Membership, RBAC, Notifications, Files, Audit, Search, Configuration).
2. **Identity comes from Person** (ADR-010).
3. **Participation comes from Membership** (ADR-011).
4. **Permissions come from RBAC** (ADR-012).
5. **Security boundary remains Tenant** (ADR-002 / ADR-003).
6. **Geographic scope uses Territory and Area** (ADR-004 / ADR-005 / ADR-013).
7. Community is enableable per Tenant via Feature Management / entitlements (ADR-023 / ADR-024) — not a Panoramica-only module.

```
Platform Core
  ↑ consume
Community Microapp
  ├── Announcements / News
  ├── Meetings / Calendar
  ├── Polls / Voting
  ├── Proposals / Discussions
  └── Experiences
```

---

## Domain Overview

Community is the social participation and communication surface for a Tenant’s community environments.

| Concern | Owned by |
|---------|----------|
| Person identity | Platform Core |
| Membership participation | Platform Core |
| Roles / Permissions | Platform Core (Security Platform RBAC) |
| Tenant / Territory / Area | Platform Core geography + tenancy |
| Notifications / Files / Audit / Search | Platform Core |
| Community content & workflows | Community microapp |

Community content entities are microapp domain data. They inherit isolation through Territory → Tenant and never invent a parallel identity or permission system.

---

## Features

| Feature | Purpose |
|---------|---------|
| **Announcements** | Official / operational communications to a scoped audience |
| **News** | Editorial or ongoing community information feed |
| **Meetings** | Scheduled gatherings with agenda/metadata |
| **Calendar** | Aggregated time view of meetings, events, experiences and relevant community dates |
| **Polls** | Lightweight opinion collection |
| **Voting** | Decision process with counted outcomes under defined rules |
| **Proposals** | Community-originated initiatives (may link to discussion/vote) |
| **Discussions** | Conversation threads attached to items or stand-alone |
| **Experiences** | Participatory community experiences / activities surfaced in Community |

Feature slices may be enabled/disabled independently inside an enabled Community microapp (ADR-023), within plan entitlements (ADR-024).

Governance concept alignment with ADR-013 remains: Announcement, Survey/Poll, Vote, Proposal, Discussion. This ADR adds News, Meetings, Calendar and Experiences as first-class Community product features.

Operational incidents/requests remain the Incidents microapp (ADR-018); Community may link to them but does not absorb service-desk workflows.

---

## Content Lifecycle

Community content shares a conceptual lifecycle (exact statuses may vary by feature):

```
draft
  → scheduled (optional)
  → published / open
  → active / collecting (polls, votes, discussions)
  → closed / completed
  → archived
```

### Feature notes

| Feature | Lifecycle emphasis |
|---------|-------------------|
| Announcements / News | Draft → (scheduled) → published → archived/expired |
| Meetings | Draft → published → started/completed → archived |
| Calendar entries | Derived and/or published dated items |
| Polls | Draft → open → closed → results visible → archived |
| Voting | Draft → open → closed → result recorded → archived |
| Proposals | Submitted → under review → accepted/rejected/withdrawn → optional vote → archived |
| Discussions | Open → locked → archived |
| Experiences | Draft → published → active/past → archived |

### Lifecycle rules

1. Transitions are **RBAC-gated**.
2. Membership type alone does not authorize publish/close/moderate.
3. Closing content does not delete Audit history (ADR-021).
4. Unpublished drafts are not broadly discoverable.
5. Lifecycle status is not a security boundary and not a Permission.

---

## Participation Model

| Concept | Role in Community |
|---------|-------------------|
| **Person** | Who is acting / represented |
| **Membership** | Whether they participate in the Tenant community (via Territory) |
| **RBAC Role Assignment** | What Community actions they may perform |
| **Observer / audience** | Who receives visibility / Notifications for an item |

### Participation rules

1. Creating Community content references Person as author/actor where applicable.
2. Audience eligibility typically requires Membership (or explicit admin Permission) in the Tenant/Territory context.
3. Property Person Relationships (owner/resident on a unit) do not replace Membership for Community participation (ADR-008 / ADR-011).
4. Official Entity / Business Profiles may author or be attributed on content only under product + verification + Permission rules (ADR-016) — they are not Person substitutes.
5. Notifications for publish/open/assign-like Community events go through Core Notifications (ADR-019).

---

## Geographic Scope

Aligned with ADR-013:

### Territory scope

Visible to the complete Territory community (subject to Authorization and privacy rules).

### Area scope

Visible only inside a Community Area (organizational subdivision).

### Rules

| Rule | Requirement |
|------|-------------|
| Territory | Mandatory isolation path for Community Business Data |
| Area | Optional audience/organization scope |
| Same Territory | Area must belong to content Territory when set |
| Isolation | Always Tenant via Territory — never Area-as-tenant |
| Calendar / Experiences | May be Territory-wide or Area-scoped like other content |

```
Tenant (security boundary)
  └── Territory (community isolation context)
        ├── Community content (Territory scope)
        └── Community Area
              └── Community content (Area scope)
```

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary |
| Territory / Area | Isolation path / organizational audience scope |
| Person | Identity — not a security boundary |
| Membership | Participation — not Authorization |
| RBAC | Publish, moderate, vote admin, configure Community |
| Platform Core | Identity, Membership, Notifications, Files, Audit, Search, Config |
| Feature entitlements | Plan + flags gate availability (ADR-023 / ADR-024) |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community microapp / feature enabled?
  → Authorization (RBAC)
  → Membership / audience eligibility
  → Geographic scope filter (Territory / Area)
  → Domain operation + Notifications / Files / Audit / Search indexing
```

### Alignment statements

- Community does not implement its own user table, ACL engine, or notifier.
- Search indexing of Community content uses Core Search with Permission/visibility filters (ADR-022).
- Attachments use Core Files references (ADR-020).
- Disabled Community features must not expose content via API/search (ADR-023).

---

## Examples

### Example 1 — Territory announcement

```
Tenant: Life Panoramica
Territory scope
Announcement: "Water maintenance tomorrow"
Audience: eligible Members in Territory
Permission: announcements.publish for author
```

### Example 2 — Area meeting + calendar

```
Area: Aldea Golf
Meeting: "Pool committee"
Appears on Community Calendar for Area audience
```

### Example 3 — Proposal → discussion → vote

```
Person (Member) submits Proposal
Discussion thread opens
Authorized actors open Voting
Results recorded; proposal status updated
```

### Example 4 — Experience with media

```
Experience published (Territory or Area)
Cover/gallery via Core Files
Discovery via Calendar / Search as entitled
```

### Example 5 — Reuse across Tenants

```
Same Community microapp
Tenant A (urbanization) enables announcements + voting
Tenant B (municipality) enables news + meetings + proposals
No codebase fork
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Hardcode Life Panoramica content types or Areas into the microapp;
- Absorb Incidents/service-desk workflows (ADR-018);
- Define vote cryptography, legal election compliance, or quorum formulas in detail;
- Implement chat infrastructure beyond Discussions as Community content;
- Replace RBAC with Membership types;
- Make Area a Tenant or RLS root;
- Finalize UX layouts or notification copy;
- Define Marketplace or Bookings inside Community.

---

## Rejected Alternatives

### Tenant-specific Community product fork

Rejected (ADR-013 / ADR-014). Must be reusable.

### Community-owned identity or permissions system

Rejected (ADR-015 / ADR-012).

### Membership type grants all Community admin powers

Rejected (ADR-011 / ADR-012).

### Area as security boundary

Rejected (ADR-005 / ADR-013).

### Merge Incidents into Community

Rejected. Different operational domain (ADR-018); links allowed.

---

## Related Domains

- ADR-013 Community Microapp Governance Model
- ADR-014 Microapp Platform Architecture
- ADR-015 Platform Core Services Model
- ADR-011 Membership Community Participation Model
- ADR-010 Person Identity Model
- ADR-012 Roles and Permissions Model
- ADR-018 Incidents and Community Requests Model
- ADR-019 Notifications and Communication Model
- ADR-020 Files, Media and Automated Storage Intelligence Model
- ADR-022 Search and Discovery Platform Model
- ADR-023 Configuration and Feature Management Model
- ADR-004 / ADR-005 Geographic models

---

## Decision Rule

Until superseded, Community must be implemented as a reusable microapp whose features (announcements, news, meetings, calendar, polls, voting, proposals, discussions, experiences) consume Platform Core for identity, participation, permissions, notifications, files and audit; keep Tenant as security boundary; scope content by Territory/Area; and never ship as a tenant-specific fork or parallel security stack.
