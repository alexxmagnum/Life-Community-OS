# ADR-026 Community Content Publishing Model

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

The Community microapp requires a reusable content model for communication, participation and community life.

ADR-025 defines Community as a reusable microapp with announcements, news, meetings, calendar, polls, voting, proposals, discussions and experiences, consuming Platform Core for identity, Membership, RBAC, Notifications, Files and Audit.

ADR-012 separates Membership (participation) from Roles/Permissions (capabilities).

ADR-019 distinguishes system Notifications from human-created Communication and requires Core notification publishing.

ADR-021 requires immutable Audit for significant publish/moderate actions.

Open questions:

1. How do official vs member-originated content differ in creation and moderation?
2. What shared publishing lifecycle applies across Community content types?
3. How do Notifications and geographic scope attach to publish events?

This ADR defines the **Community Content Publishing Model**.

It does not create migrations or tables.

---

## Decision

**Community content uses a shared publishing model** with **different creation and moderation rules depending on content type**.

### Core rules

1. **Official content requires authorized roles** (RBAC).
2. **Community content can be created by members according to permissions** (RBAC — not Membership type alone).
3. **Permissions come from RBAC** (ADR-012).
4. **Tenant remains the security boundary.**
5. **Territory and Area define visibility scope** (ADR-013 / ADR-025).
6. Publish/moderate transitions are auditable (ADR-021) and may emit Notifications (ADR-019).
7. The publishing model is reusable across Tenants — not hardcoded to Life Panoramica.

```
Author (Person + Permissions)
  → Content draft
  → (optional) moderation / review
  → published (Territory / Area scope)
  → Notifications + Activity/Audit
  → expired / archived
```

---

## Content Types

| Content type | Typical nature | Default creation posture |
|--------------|----------------|--------------------------|
| **Official announcements** | Authoritative community/tenant communication | Official / authorized roles only |
| **News** | Editorial or ongoing information | Authorized publishers (often official/editorial roles) |
| **Meetings** | Scheduled gatherings | Authorized organizers / admins; members if permitted |
| **Events** | Community happenings (calendar-facing) | Authorized creators per Permission |
| **Polls** | Lightweight opinion collection | Members and/or official actors per Permission |
| **Voting** | Decision process with counted outcomes | Authorized openers; participation per vote rules + Permissions |
| **Proposals** | Community-originated initiatives | Members per Permission; review often required |
| **Discussions** | Conversation layer | Members per Permission |
| **Experiences** | Participatory activities / experiences | Authorized creators; members if permitted |

“Official content” primarily means **official announcements** and other items explicitly marked or restricted as official voice.  
“Community content” means member-participatory types (proposals, discussions, many polls/experiences) under Permission gates.

Events here are Community-published calendar entities; they remain Community domain content unless a separate Events microapp is entitled and linked later (ADR-014).

---

## Publishing Workflow

### Shared lifecycle

```
draft
  → pending_review
  → published
  → expired
  → archived
```

| Status | Meaning |
|--------|---------|
| `draft` | Being authored; not broadly visible |
| `pending_review` | Submitted for moderation / official review |
| `published` | Live for eligible audience in scope |
| `expired` | Past end/expiry; not primary feed content |
| `archived` | Retained historically; not operationally active |

### Workflow variants by type

| Path | Typical use |
|------|-------------|
| **Direct publish** | Official announcements by authorized roles; some news/meetings when policy allows |
| **Create → review → publish** | Proposals, member news, sensitive discussions, experiences requiring approval |
| **Publish → open window → expire** | Polls and voting with explicit open/close (maps to published/expired semantics) |

Not every type must visit `pending_review`. Product configuration (ADR-023) may require review for selected types per Tenant.

### Publishing rules

1. Transition into `published` requires the appropriate RBAC Permission for that type.
2. Authors remain Person-linked; Official Entity attribution is optional and governed (ADR-016).
3. Scheduling may delay visibility while status is `published` or via a scheduled draft policy — implementation detail must not bypass Permission checks.
4. Unpublish/revert emits Audit Events; may return to `draft` or move to `archived` per policy.
5. Lifecycle status is not a Permission and not a Tenant boundary.

---

## Moderation

Moderation is the controlled review and governance of Community content.

### Moderation capabilities (Permission-gated)

- approve / reject (`pending_review` → `published` or back to `draft` / `archived`);
- edit/lock discussions;
- remove or archive violating content;
- feature/pin official items (product option);
- manage expiry.

### Moderation rules

1. Moderators are defined by **RBAC roles/permissions**, not by Membership type strings (`resident`, `staff`, …).
2. Official announcements cannot be published by unauthorized members.
3. Member-created proposals/discussions may require moderation depending on Tenant feature configuration.
4. Moderation actions are auditable; significant actions may notify authors via Core Notifications.
5. Moderation never grants cross-tenant access.

---

## Participation

| Actor | Publishing role |
|-------|-----------------|
| **Author** | Person creating/editing content |
| **Moderator / publisher** | Person with review/publish Permissions |
| **Audience** | Eligible Members (and other permitted viewers) in Territory/Area scope |
| **Participants** | Voters, poll respondents, discussion commenters per feature rules |

### Participation rules

1. Identity = Person; login = User Account/Identity; participation eligibility often requires Membership.
2. Creating content ≠ permission to publish officially.
3. Voting/poll participation requires feature open state + Permission/eligibility — Membership alone is insufficient if Permission denies.
4. Property relationships do not replace Membership for Community audience eligibility (ADR-011).

---

## Notifications

Publishing integrates with Platform Core Notifications (ADR-019).

### Typical events

| Event | Example |
|-------|---------|
| Content published | Official announcement published |
| Review needed | Proposal entered `pending_review` |
| Review decision | Proposal approved/rejected |
| Participation window | Voting opened / poll closing soon |
| Discussion activity | New comment on watched thread |

### Notification rules

1. Community emits notification events to Core; it does not run a parallel mail/push stack.
2. Notifications are Communication alerts about content — not the content system of record.
3. Audience resolution uses Tenant Context + Membership/observer rules + Permissions.
4. Notifications are not Permissions and do not expand who can publish.

---

## Geographic Scope

| Scope | Visibility |
|-------|------------|
| **Territory** | Entire Territory community (eligible actors) |
| **Area** | Specific Community Area only |

### Rules

1. Every published item has a Territory isolation path.
2. Area scope is optional organizational audience filter.
3. Area must belong to the content’s Territory when set.
4. Changing scope after publish is Permission-gated and auditable.
5. Area scope is not a security boundary.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary |
| Territory / Area | Isolation path / visibility scope |
| RBAC | Create, submit, publish, moderate, expire, archive by type |
| Membership | Participation / audience eligibility — not AuthZ |
| Notifications | Core delivery under Tenant Context |
| Audit | Publish, moderate, scope changes, official attribution |
| Files | Attachments via Core Files (ADR-020) |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community / content-type feature enabled?
  → Authorization (RBAC for create/submit/publish/moderate)
  → Membership / audience eligibility
  → Geographic scope
  → Lifecycle transition
  → Notifications + Audit + Search index update
```

---

## Examples

### Example 1 — Official announcement

```
Role: community_admin (Permission: announcements.publish_official)
Create official announcement → published (skip review per policy)
Scope: Territory Life Panoramica
Notify: eligible Members
Audit: publish
```

### Example 2 — Member proposal with review

```
Member Permission: proposals.create
Create proposal → pending_review
Moderator Permission: proposals.moderate → published
Scope: Area Aldea Golf
Discussion may open; optional later voting
```

### Example 3 — Poll

```
Authorized creator publishes poll
Status: published (open window)
Members respond per eligibility
Expires → expired → archived
```

### Example 4 — Unauthorized official voice

```
Member without official publish Permission
Attempt official announcement → denied
May still create proposal/discussion if those Permissions exist
```

### Example 5 — Cross-cutting services

```
Publish experience with gallery
  → Files Core variants
  → Search index document
  → notification.experience.published
  → Audit Event
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Finalize Permission key taxonomy for every content type;
- Define legal notice templates or editorial style guides;
- Implement rich CMS / WYSIWYG requirements;
- Define vote tally cryptography or electoral law compliance;
- Replace Incidents publishing (ADR-018);
- Make `pending_review` mandatory for all types in all Tenants;
- Allow Membership type to bypass publish Permissions.

---

## Rejected Alternatives

### One publish Permission for all content types

Rejected as the only model. Official vs member paths need distinct Authorization.

### Membership type `administrator` implies publish-all

Rejected (ADR-012). RBAC Role Assignment grants capabilities.

### Per-tenant custom publishing engines

Rejected (ADR-014 / ADR-025). Shared publishing model required.

### Notifications as the content store

Rejected (ADR-019). Content is Communication domain; notifications alert.

### Area as Tenant / publish boundary

Rejected. Tenant remains isolation root; Area is visibility scope.

### Unpublished content in public discovery by default

Rejected. Drafts/`pending_review` are not broadly discoverable.

---

## Related Domains

- ADR-025 Community Microapp Domain Model
- ADR-013 Community Microapp Governance Model
- ADR-012 Roles and Permissions Model
- ADR-019 Notifications and Communication Model
- ADR-021 Audit and Activity Tracking Model
- ADR-011 Membership Community Participation Model
- ADR-020 Files, Media and Automated Storage Intelligence Model
- ADR-022 Search and Discovery Platform Model
- ADR-023 Configuration and Feature Management Model

---

## Decision Rule

Until superseded, Community communication and participation content must use this shared publishing model: typed content with RBAC-gated official vs member creation paths, optional moderation via `pending_review`, Territory/Area visibility, Core Notifications and Audit on publish/moderate — never treating Membership type as publish authority or Area as a security boundary.
