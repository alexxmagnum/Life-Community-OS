# ADR-027 Community Experiences and Events Model

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

Life Community OS must create **community engagement**, not only administrative communication.

ADR-025 includes **experiences**, **meetings** and calendar-facing activity inside the reusable Community microapp.

ADR-026 provides a shared publishing model (draft → pending_review → published → expired → archived) with RBAC-gated official vs member creation paths and Territory/Area visibility.

ADR-020 / ADR-019 require media and notifications to go through Platform Core — not microapp-local pipelines.

Open questions:

1. How do experiences, events and meetings differ while sharing Community publishing and participation patterns?
2. How do registration, attendance, capacity and waitlists work without becoming a full Bookings/Marketplace product?
3. How do organizers, Members, Files and Notifications interact securely?

This ADR defines the **Community Experiences and Events Model**.

It does not create migrations or tables.

---

## Decision

**Experiences & Events is a reusable capability inside the Community Microapp.**

It enables **creation, discovery and participation** in activities.

### Types

- experiences;
- events;
- meetings.

### Capabilities

- creation;
- publishing;
- registration;
- attendance;
- capacity management;
- waitlists;
- reminders;
- media galleries.

### Core rules

1. **Organizer permissions come from RBAC** (ADR-012 / ADR-026).
2. **Participation comes from Membership** (eligibility) plus feature Permissions where required (ADR-011).
3. **Tenant remains the security boundary.**
4. **Territory and Area define scope** (visibility / audience).
5. **Notifications and Files are Platform Core services** (ADR-019 / ADR-020).
6. This capability creates engagement inside Community — it does not replace Bookings, Marketplace, or paid commerce microapps (those remain separate if entitled).

```
Community Microapp
  └── Experiences & Events capability
        ├── Experience
        ├── Event
        └── Meeting
              ↑ Person + Membership + RBAC
              ↑ Files (galleries) + Notifications (reminders)
```

---

## Experience Types

| Type | Purpose | Engagement emphasis |
|------|---------|---------------------|
| **Experience** | Participatory community activity / lived offering (social, cultural, wellbeing, local life) | Discovery, registration, galleries, ongoing or dated participation |
| **Event** | Time-bound community happening | Schedule, capacity, reminders, attendance |
| **Meeting** | Organized gathering with agenda/operational purpose | Scheduling, invite/audience, attendance records |

### Type rules

1. All three use Community publishing and Territory/Area scope (ADR-026).
2. Calendar surfaces may aggregate published items across types (ADR-025).
3. Product configuration may enable types independently (ADR-023).
4. “Experience” is not a Business Profile and not a Person; organizers remain Persons (or attributed Official/Business actors under ADR-016 rules).

---

## Participation Model

| Concept | Meaning |
|---------|---------|
| **Eligible audience** | Members (and other permitted viewers) in Territory/Area scope |
| **Registrant** | Person registered to attend/participate |
| **Attendee** | Person marked as attended (check-in / confirmation) |
| **Waitlisted** | Person waiting for capacity |

### Participation rules

1. **Membership** establishes community participation eligibility for registration by default.
2. Additional RBAC/feature Permissions may restrict who can register for specific items (e.g. private meetings).
3. Property relationships do not replace Membership for Community activity eligibility.
4. Registration creates a participation record — it is not a SaaS Subscription and not a Permission grant.
5. Capacity and waitlists apply per activity item within Tenant Context.
6. Guest/non-member participation, if ever allowed, requires explicit Tenant policy and must not weaken Tenant isolation.

---

## Organizer Model

| Concept | Meaning |
|---------|---------|
| **Organizer** | Person (or authorized representative) responsible for creating/managing the activity |
| **Co-organizer** | Additional authorized managers when product allows |

### Organizer rules

1. Organizer capabilities (`create`, `publish`, `manage registrations`, `take attendance`, …) come from **RBAC**, not Membership type alone.
2. Official announcements remain a separate official publishing path; an Event/Meeting can still be official-scoped if Permissions allow.
3. Organizers may attach media galleries via Core Files references.
4. Organizer assignment changes are auditable when security-relevant (ADR-021).
5. Being an organizer on one activity does not grant Tenant-wide Community admin rights.

---

## Lifecycle

Aligned with ADR-026 publishing, with activity-specific operational phases:

```
draft
  → pending_review (if required)
  → published
  → registration_open (optional explicit phase)
  → in_progress / ongoing
  → completed
  → expired
  → archived
```

| Status / phase | Meaning |
|----------------|---------|
| `draft` / `pending_review` / `published` | Shared publishing model |
| `registration_open` | Accepting registrants (may equal published + window flags) |
| `in_progress` / `ongoing` | Activity occurring |
| `completed` | Finished; attendance may be finalized |
| `expired` / `archived` | No longer primary discovery content |

### Lifecycle rules

1. Publish/registration transitions are Permission-gated.
2. Closing registration differs from archiving content.
3. Capacity full → new registrants go to waitlist or are denied per policy.
4. Promoting from waitlist emits Notifications and Audit where relevant.
5. Lifecycle is not a security boundary.

---

## Notifications

Uses Platform Core Notifications (ADR-019).

### Typical events

| Event | Example |
|-------|---------|
| Published / discoverable | New experience in Area |
| Registration confirmed | User registered |
| Waitlist promoted | Seat available |
| Reminders | Meeting starts in 24h / 1h |
| Cancelled / rescheduled | Time or status change |
| Attendance follow-up | Optional post-event note |

### Notification rules

1. Community emits events to Core; no parallel notifier.
2. Reminder schedules are Core-delivered jobs under Tenant Context.
3. Notifications are not Permissions.
4. Reminder volume may be subject to commercial notification meters (ADR-024).

---

## Media Integration

Uses Platform Core Files & Media (ADR-020).

### Typical media

- cover image;
- gallery;
- short promotional video (within Core video policies);
- meeting documents/attachments (visibility often restricted).

### Media rules

1. Contextual capture/upload allowed; processing/optimization/delivery stay in Core.
2. Domain entities hold **File References**; Physical Files stay Core-owned.
3. List/discovery UIs must use thumbnails/optimized variants — not full originals.
4. Galleries inherit Tenant Context and content visibility/scope rules.
5. Microapps must not implement independent media pipelines for experiences/events.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary |
| Territory / Area | Visibility / audience scope |
| RBAC | Organizer and moderation capabilities |
| Membership | Participation eligibility |
| Registration records | Tenant-scoped; not a security boundary |
| Notifications / Files | Platform Core only |
| Audit | Publish, capacity overrides, attendance exports as required |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community / experiences-events feature enabled?
  → Authorization (organize vs register Permissions)
  → Membership / audience eligibility
  → Geographic scope
  → Capacity / waitlist rules
  → Notifications + Files + Audit/Search updates
```

---

## Examples

### Example 1 — Area experience with gallery

```
Organizer Permission: experiences.publish
Scope: Area Aldea Golf
Experience published + registration_open
Media: cover + gallery via Core Files
Members register until capacity; overflow → waitlist
Reminders via Core Notifications
```

### Example 2 — Territory event

```
Event: Summer community day
Scope: Territory Life Panoramica
Capacity managed; attendance recorded
Calendar discovery for eligible Members
```

### Example 3 — Operational meeting

```
Meeting: Pool committee
Scope: Area
Registration optional / invite-only per Permission
Attachments: restricted agenda PDF (Files visibility restricted)
```

### Example 4 — Unauthorized organizer

```
Member without organize Permission
Can register for published public experiences if eligible
Cannot publish new events
```

### Example 5 — Engagement vs commerce

```
Free community yoga experience → Community Experiences & Events
Paid external booking marketplace slot → separate Bookings/Marketplace microapp (if entitled)
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Implement paid ticketing, refunds, or checkout (Bookings/Marketplace);
- Define full facility resource scheduling / room conflict engines;
- Build a standalone Events SaaS outside Community;
- Replace Incidents with event outages reporting;
- Make registration a Security Platform Role;
- Finalize reminder cadence defaults per Tenant;
- Allow Area to act as Tenant isolation root.

---

## Rejected Alternatives

### Experiences as a separate SaaS / independent microapp by default

Rejected for Foundation. Lives inside Community as a reusable capability (ADR-025); a future split requires an explicit ADR.

### Organizer = Membership type

Rejected. Organizer powers are RBAC.

### Per-activity private file/notification stacks

Rejected (ADR-019 / ADR-020).

### Registration without Tenant Context

Rejected. Fail closed.

### Capacity/waitlist as the billing Subscription model

Rejected. SaaS billing remains Tenant-organization subscriptions (ADR-024).

---

## Related Domains

- ADR-025 Community Microapp Domain Model
- ADR-026 Community Content Publishing Model
- ADR-020 Files, Media and Automated Storage Intelligence Model
- ADR-019 Notifications and Communication Model
- ADR-013 Community Microapp Governance Model
- ADR-011 Membership Community Participation Model
- ADR-012 Roles and Permissions Model
- ADR-021 Audit and Activity Tracking Model
- ADR-022 Search and Discovery Platform Model
- Future: Bookings / Marketplace microapps

---

## Decision Rule

Until superseded, community engagement activities must be implemented as the Experiences & Events capability inside Community: typed experiences/events/meetings with RBAC organizers, Membership-based participation, capacity/waitlists/reminders, Core Files galleries and Core Notifications, Territory/Area scope, and Tenant as security boundary — never as a tenant-specific fork or parallel media/notification/auth stack.
