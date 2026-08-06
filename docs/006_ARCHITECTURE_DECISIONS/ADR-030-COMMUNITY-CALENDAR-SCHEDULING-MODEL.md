# ADR-030 Community Calendar and Scheduling Model

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

Community requires a **unified time and scheduling model** for activities, events, meetings and participation.

ADR-025 includes Calendar as a Community feature aggregating dated community life.

ADR-027 defines Experiences, Events and Meetings with registration, capacity, waitlists and reminders via Core Notifications.

ADR-029 allows Groups/Circles to host or filter activities without becoming Tenants.

ADR-019 requires reminders and schedule notifications to use Platform Core Notifications — not a microapp-local mailer.

Open questions:

1. What belongs on the Community Calendar versus source entities (event/meeting/experience)?
2. How do recurrence, reminders and participation attach without becoming Google Calendar/Outlook replacement?
3. How do Territory/Area and Group filters apply under Tenant isolation?

This ADR defines the **Community Calendar and Scheduling Model**.

It does not create migrations or tables.

---

## Decision

**Calendar & Scheduling is a reusable Community capability.**

It provides **unified planning** for community life **without becoming an external calendar replacement** (not a personal productivity suite or sync-first Outlook/Google substitute as the product mission).

### Core rules

1. **Person remains identity.**
2. **Membership defines participation** eligibility in the Tenant community.
3. **RBAC controls capabilities** (create/publish schedule items, manage series, export admin views, etc.).
4. **Notifications handle reminders** via Platform Core (ADR-019).
5. **Tenant remains the security boundary.**
6. **Territory/Area define geographic scope** for visibility.
7. Calendar is primarily an **aggregation and scheduling projection** over Community dated entities, plus optional standalone schedule notes when product allows.
8. External calendar export/subscribe may be offered later as integration — it must not redefine Tenant isolation or become the system of record by default.

```
Community dated entities (experiences, events, meetings, …)
        │ project / index by time
        ▼
Community Calendar & Scheduling
        │ filters: Territory / Area / Group / membership
        ▼
Person views + Core Notification reminders
```

---

## Calendar Items

### Item sources

| Source type | Calendar role |
|-------------|---------------|
| **Experience** | Dated/ongoing engagement activity (ADR-027) |
| **Event** | Time-bound community happening |
| **Meeting** | Organized gathering with agenda/ops purpose |
| **Other Community dated content** | e.g. published announcements with schedule windows, polls/votes with open windows — when configured to appear |
| **Standalone schedule item** (optional) | Lightweight calendar-only note if Tenant enables it — still Tenant-scoped |

### Item model (conceptual)

A calendar item projection includes at least:

- source entity type + id (system of record);
- title/summary;
- start/end (or all-day);
- timezone handling policy;
- Territory scope + optional Area;
- optional Group association;
- visibility / audience class;
- participation mode (none / RSVP / registration);
- organizer references;
- status derived from publishing lifecycle (draft not broadly listed).

### Rules

1. **Source entities remain authoritative** for registration, capacity, media and moderation.
2. Calendar must not invent a second writable copy that can diverge undetected; projections rebuild from sources.
3. Unpublished/`pending_review` items are hidden from general calendars (authors/moderators may see restricted views).
4. Search/discovery may use Core Search time filters (ADR-022) aligned with the same visibility rules.

---

## Recurrence

Recurrence expresses repeating community schedule patterns (e.g. weekly yoga, monthly committee).

### Recurrence rules

1. Recurrence belongs to the **source scheduling definition** (experience/event/meeting series), with calendar expanding occurrences for display.
2. Support common patterns conceptually: daily/weekly/monthly, interval, optional end date/count, exception dates (cancel/reschedule one occurrence).
3. Editing a series vs a single occurrence must be Permission-gated and auditable when security-relevant.
4. Capacity, registration and attendance are evaluated **per occurrence** unless product explicitly defines series-wide registration.
5. Recurrence engines stay in Community/Core scheduling — microapps do not each implement private RRULE stacks.
6. Recurrence is not a security boundary.

---

## Participation

| Mode | Meaning |
|------|---------|
| **View-only** | Item visible on calendar; no RSVP |
| **RSVP / interest** | Light intent signal |
| **Registration** | Formal signup (ADR-027 capacity/waitlist) |
| **Attendance** | Check-in / attended record |

### Participation rules

1. Eligibility defaults to **Tenant Membership** in scope; additional RBAC may restrict private meetings/groups.
2. Group-hosted items may further require **Group Membership** (ADR-029).
3. Calendar visibility ≠ automatic registration Permission.
4. Personal “my calendar” is a filtered view of eligible items + the Person’s registrations — still inside Tenant Context.
5. Participation records remain on source entities; calendar reflects them.

---

## Reminders

Reminders are schedule-driven Notifications through Platform Core.

### Typical reminders

- 24h / 1h before start;
- registration opening/closing;
- waitlist promotion;
- series cancellation / time change.

### Reminder rules

1. Community schedules reminder intents; **Core Notifications** delivers (`in_app`, email, push, sms per preferences/policy).
2. Reminders respect visibility and registration relationship (do not remind non-eligible Persons about private meetings).
3. Reminder volume may be metered commercially (ADR-024).
4. Reminders are not Permissions and not Audit substitutes (Audit still records significant schedule changes).
5. Users may configure reminder preferences without enabling privileged calendar admin.

---

## Geographic Scope

| Scope | Calendar effect |
|-------|-----------------|
| **Territory** | Default community-wide schedule |
| **Area** | Local schedule facet (e.g. Aldea Golf only) |

### Rules

1. Items inherit Territory isolation path from source entities.
2. Area filters organizational visibility — not a Tenant boundary.
3. Users may filter calendar by Area without leaving Tenant Context.
4. Cross-territory blended calendars inside one Tenant are allowed when the Tenant has multiple Territories; cross-tenant calendars are not.

---

## Group Integration

| Integration | Behaviour |
|-------------|-----------|
| Group-hosted item | Appears on group calendar surfaces and eligible member calendars |
| Filter by Group | Members filter “my groups” schedules |
| Private group meetings | Visible to Group Members + authorized admins only |

### Rules

1. Groups remain organizational (ADR-029) — not calendar tenancy.
2. Group calendar is a filter/projection, not a separate SaaS calendar product.
3. Non-members must not see private group schedule details via Territory calendar.
4. Organizer Permissions still come from RBAC (optionally group-scoped).

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for all schedule data |
| Territory / Area | Visibility / filter scope |
| Group | Optional audience organization |
| Person | Identity for organizers/registrants |
| Membership | Community participation eligibility |
| RBAC | Schedule publish/manage/export capabilities |
| Notifications | Reminder delivery |
| Calendar | Not a security boundary; not system of record for registrations |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community / calendar feature enabled?
  → Authorization (view vs manage)
  → Membership / Group eligibility
  → Territory/Area/Group filters
  → Return projected items
  → Reminder fan-out via Core Notifications when scheduled
```

### Alignment statements

- Calendar APIs must not leak other Tenants’ schedules.
- ICS/export links (if offered) must be Capability-gated, tenant-scoped, and rotatable — not perpetual public secrets.
- Disabled calendar capability must not expose schedule write APIs (ADR-023).
- External sync connectors, if added later, are integrations under Tenant Context — not a transfer of system of record outside Core/Community without ADR.

---

## Examples

### Example 1 — Unified community week

```
Territory calendar shows:
  - Area pool meeting (Meeting)
  - Summer community day (Event)
  - Weekly yoga experience occurrence (Experience series)
Eligible Members see items for their scope; private committee meeting hidden
```

### Example 2 — Recurring experience

```
Experience series: Tue/Thu 18:00
Calendar expands occurrences
Registration per occurrence with capacity
Reminders to registrants via Core Notifications
```

### Example 3 — Group filter

```
Person in Gardening Circle
Filters calendar to Group-hosted workshops
Still same Tenant isolation
```

### Example 4 — Not an Outlook replacement

```
Community Calendar plans community life
Personal work calendar sync is optional future integration
SaaS mission remains community OS — not enterprise mail/calendar suite
```

### Example 5 — Unauthorized manage

```
Member can view public Territory calendar and register when permitted
Cannot reschedule series without schedule.manage / organize Permission
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Replace Google Calendar / Outlook / Apple Calendar as a personal productivity product;
- Define full free/busy resource booking for rooms/assets (may be Bookings later);
- Implement paid ticket checkout;
- Make calendar the registration system of record;
- Build cross-tenant public event marketplaces by default;
- Finalize timezone UI edge cases or holiday calendars worldwide;
- Allow Area/Group to become RLS/Tenant roots.

---

## Rejected Alternatives

### Calendar as system of record duplicating events

Rejected. Source experiences/events/meetings remain authoritative.

### External calendar product as primary architecture

Rejected. Community Calendar is an in-platform planning capability; external tools are optional integrations.

### Reminder emails from Community microapp SMTP

Rejected (ADR-019). Use Core Notifications.

### Membership type grants schedule-admin

Rejected (ADR-012). RBAC controls capabilities.

### Cross-tenant shared calendar by default

Rejected. Breaks Tenant isolation.

### Group calendar as nested Tenant

Rejected (ADR-029).

---

## Related Domains

- ADR-025 Community Microapp Domain Model
- ADR-027 Community Experiences and Events Model
- ADR-029 Community Groups and Circles Model
- ADR-026 Community Content Publishing Model
- ADR-019 Notifications and Communication Model
- ADR-011 Membership Community Participation Model
- ADR-012 Roles and Permissions Model
- ADR-021 Audit and Activity Tracking Model
- ADR-022 Search and Discovery Platform Model
- ADR-023 Configuration and Feature Management Model
- Future: Bookings microapp / external calendar integrations

---

## Decision Rule

Until superseded, community time planning must use the Community Calendar & Scheduling capability as a tenant-scoped projection over experiences/events/meetings (with recurrence, participation filters, Territory/Area/Group facets, and Core Notification reminders), keeping Person/Membership/RBAC boundaries intact — never as an external calendar replacement, second system of record, or independent security boundary.
