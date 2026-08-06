# ADR-019 Notifications and Communication Model

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

Life Community OS microapps require a shared communication layer.

Community, Services, Incidents, Events and future modules need notifications without duplicating logic.

ADR-014 establishes reusable microapps on Platform Core with per-Tenant enablement.

ADR-015 places **Notifications** (and messaging foundations) in Platform Core and forbids microapp-local parallel notification stacks.

Open questions:

1. How do microapps emit notification events without owning delivery?
2. How are recipients resolved safely under Tenant Context?
3. How do system notifications differ from human-created communication content?
4. How can channels (in-app, email, push, SMS) evolve without redesigning each microapp?

This ADR defines the **Notifications and Communication Model**.

It does not create migrations or tables.

---

## Decision

**Notifications are a Platform Core service.**

Microapps **publish notification events** and **consume the shared notification system**.

### Core rules

1. **Microapps do not create independent notification systems.**
2. **Notifications are not permissions** and do not grant Authorization.
3. **Notification visibility follows Tenant security** (Tenant Context; fail closed for tenant Business Data).
4. **Recipients are resolved through Person / User Account / Membership context** (and explicit observer/assignee lists where provided by the producing microapp).
5. Channel providers are replaceable infrastructure behind Core contracts.
6. Life Panoramica is a Tenant consumer of Core Notifications — not a forked notifier.

```
Microapps (Community, Incidents, Services, Events, …)
        │ publish events / requests
        ▼
Platform Core — Notifications
        │ resolve recipients + preferences + Tenant Context
        ▼
Channels (in_app, email, push, sms, …)
```

---

## Notification Model

### Notification

A **system-generated message** produced because something happened in the platform (domain event, lifecycle transition, verification outcome, assignment, etc.).

Characteristics:

- triggered by platform/microapp logic;
- addressed to resolved recipients;
- carries template/key, payload references, and Tenant Context;
- may be read/unread in-app;
- delivery attempted on one or more channels per preferences and policy;
- auditable where security-relevant.

### Notification event (producer contract)

Microapps publish a Core notification request/event that includes at least:

| Element | Purpose |
|---------|---------|
| Tenant Context | Isolation and routing boundary |
| Source microapp / type | Provenance (e.g. `incidents.assigned`) |
| Subject references | Entity ids (incident, announcement, profile) — not cross-tenant blobs |
| Recipient selectors | Explicit Persons and/or resolution rules (assignees, observers, Territory audience, …) |
| Priority / category | Optional product routing |
| Channel hints | Optional; Core may override by policy/preferences |

Core owns fan-out, deduplication, preference enforcement, provider calls and failure handling.

### Recipient resolution

Recipients resolve through:

- **Person** — human subject of delivery preference and domain addressing;
- **User Account / Identity** — authenticated delivery endpoints (email/push bindings);
- **Membership context** — whether the Person participates in the Tenant/Territory community for audience-scoped notifications;
- explicit lists from the producing use case (reporter, assignee, observers).

Resolution must not invent recipients outside Tenant Context for tenant-scoped events.

### Preference and quiet rules (conceptual)

Core may honor per-Person / per-Tenant preferences (channel opt-in/out, mute categories). Preferences never bypass Authorization for the underlying action; they only affect delivery.

---

## Communication vs Notification

| Concept | Origin | Purpose |
|---------|--------|---------|
| **Notification** | System-generated | Alert that something happened; drive attention to an entity/action |
| **Communication** | Human-created message/content | Announcements, comments, discussion posts, direct human messaging content |

### Rules

1. Community **announcements** are Communication (content) that may **emit** Notifications (“announcement published”).
2. Incident **comments** are Communication threads that may emit Notifications (“new comment”).
3. Notifications should reference Communication/content entities rather than duplicating full body content across channels when avoidable.
4. Messaging foundations (ADR-015) may evolve human-to-human Communication; they still use Core delivery where notifications are required.
5. Neither Notification nor Communication replaces RBAC.

---

## Channels

Core must support future delivery channels without redesigning microapps:

| Channel | Typical use |
|---------|-------------|
| `in_app` | Inbox / bell / feed inside the product |
| `email` | Asynchronous reach |
| `push` | Mobile/PWA push |
| `sms` | High-urgency or low-connectivity scenarios |

### Channel rules

1. Microapps request notifications; they do not hardcode provider SDKs as the primary integration path.
2. Channel availability may depend on Tenant plan/configuration (Commercial Core) and Person preferences.
3. Missing channel binding (e.g. no push token) fails soft for that channel — it does not fail the domain transaction unless product requires it.
4. Channel providers are replaceable; Core contracts remain stable.
5. Sensitive payloads must respect data minimization per channel (e.g. SMS short form).

---

## Microapp Integration

### Producer pattern

```
Domain action authorized + committed
  → microapp publishes notification event to Core
  → Core resolves recipients under Tenant Context
  → Core enqueues channel deliveries
  → Core records delivery/audit as required
```

### Example sources

| Microapp | Example events |
|----------|----------------|
| **Community** | announcement published; voting opened |
| **Incidents** | incident created; incident assigned; incident resolved |
| **Services** | profile verified; request received |
| **Events** (future) | event reminder; RSVP update |

### Consumer pattern

- In-app clients read the Core notification inbox for the authenticated Person/User Account.
- Microapps deep-link from notification payloads to their entities.
- Microapps do not store a second per-app notification inbox as source of truth.

### Enablement

If a microapp is disabled for a Tenant, new events from that microapp should not notify. Core still isolates historical notifications by Tenant.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security boundary for notification data and fan-out |
| Notifications | Not Permissions; not Membership substitutes |
| Recipient resolution | Person / User Account / Membership + explicit selectors |
| Microapps | Publish only; no independent notifier |
| Authorization | Required for the triggering action; notification is a side effect |
| Cross-tenant | Forbidden by default for tenant-scoped events |
| Audit | Security-relevant notification operations use Core Audit where applicable |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Authorization for domain action
  → Domain commit
  → Core notification publish
  → Recipient resolution (tenant-safe)
  → Channel delivery
```

### Alignment statements

- Notification content must not leak other Tenants’ Business Data.
- Audience “whole Territory” still requires Tenant Context and participation/eligibility rules.
- Privileged broadcast to all tenant members requires explicit Permission on the producing action — notification delivery does not create that Permission.
- Service Role / provider webhooks remain backend-only (ADR-003 alignment).

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Choose email/SMS/push vendors;
- Define full template languages or localization catalogs;
- Implement chat, inbox UX, or digests in detail;
- Define legal marketing-consent frameworks (must be respected later);
- Make Notifications an Authorization engine;
- Allow microapps to embed provider credentials in clients;
- Finalize realtime transport (websocket vs poll).

---

## Rejected Alternatives

### Each microapp ships its own email/push stack

Rejected (ADR-015). Causes inconsistent tenancy, preferences and security.

### Notification = Permission grant

Rejected. Delivery is not Authorization (ADR-012).

### Global cross-tenant notification bus without Tenant Context

Rejected. Breaks isolation (ADR-002 / ADR-003).

### Store only User Account emails on microapp tables as the directory of recipients

Rejected as primary model. Recipient resolution belongs in Core via Person/User Account relationships.

### Treat announcements solely as notifications without Communication content entities

Rejected. Human-created content remains Communication; notifications alert about it.

---

## Related Domains

- ADR-014 Microapp Platform Architecture
- ADR-015 Platform Core Services Model
- ADR-012 Roles and Permissions Model
- ADR-013 Community Microapp Governance Model
- ADR-018 Incidents and Community Requests Model
- ADR-017 Service Directory Discovery Model
- ADR-010 Person Identity Model
- ADR-011 Membership Community Participation Model
- Security: Audit, Authentication, data minimization

---

## Decision Rule

Until superseded, all microapp alerting must go through Platform Core Notifications: microapps publish tenant-scoped events, Core resolves Person/User/Membership recipients and delivers via shared channels, and no microapp may implement an independent notification system or treat notifications as permissions.
