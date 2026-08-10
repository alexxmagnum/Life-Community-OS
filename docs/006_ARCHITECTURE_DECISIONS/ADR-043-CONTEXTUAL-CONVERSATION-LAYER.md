# ADR-043 Contextual Conversation Layer

Version: 1.0  
Status: Accepted  
Document Type: Architecture Decision Record  
Priority: Critical  
Date: 2026-08-10  

---

## Status

Accepted — contracts live in `packages/types/src/platform/communication`.  
Phase 2.1 consolidates known context types, persistence direction, communication events, and delivery channel ports.

---

## Context

Life Community OS needs human communication without becoming a WhatsApp clone or global chat product.

Product law:

> Communication is contextual conversation around real community actions.

Related decisions:

- ADR-019 — Notifications ≠ Conversation  
- ADR-028 — Content comments/reactions (public participation)  
- ADR-035 / ADR-039 — Channels are organization, not ChatRooms  

Code already referenced “ADR-043” before this file existed. This ADR closes that documentation gap.

---

## Decision

### 1. Communication is Platform Core infrastructure

Core owns:

- `ConversationContext`
- `Conversation`
- `Message`
- Context adapter contracts + registry
- Persistence **port** (`ConversationRepository`)
- Communication **events** (`conversation_created`, `message_received`, `context_updated`)
- Delivery **channel ports** (`in_app`, `push`, `email`, `sms`, `whatsapp`)

Core must not own:

- Tenant demo users
- Tenant copy
- Tenant routes
- Panoramica-specific entities

### 2. Conversations are always contextual

Every Conversation binds to a domain entity via `ConversationContext.contextType` + `contextId` + owning `moduleId`.

Known context types (Phase 2.1):

| contextType | Module | Product surface |
|-------------|--------|-----------------|
| `experience` | experiences | Wired |
| `group` | community.groups | Wired |
| `service` | services (WorkPost) | Wired |
| `marketplace` | marketplace | Wired |
| `place` | nearby | Wired (Phase 2.1) |
| `official` | official | Wired |
| `community_discussion` | community | Adapter only |
| `reservation` | reservations | Adapter only |
| `service_request` | services | Extension point (fail closed) |
| `housing_listing` | housing | Extension point (fail closed) |

Open union remains for future modules without Core edits.

### 3. Domains talk through adapters

Core does not switch on business types. Domain modules register adapters:

- `canOpen` / `canView`
- participants
- title
- lifecycle

Examples: MarketplaceConversationAdapter, ExperienceConversationAdapter, PlaceConversationAdapter, future HousingConversationAdapter.

### 4. Persistence migration path

| | Current | Target |
|--|---------|--------|
| Mode | `demo_session` | `platform_service` |
| Owner | Tenant Content (D) localStorage seeds | Platform Core (A) Conversation service |
| Adapters | Unchanged | Unchanged |

Demo storage must never be presented as production multi-device messaging.

### 5. Notifications relationship

Communication events may feed ADR-019 Notification delivery.  
Publishing events ≠ building inbox UI.  
No fake unread badges.

### 6. WhatsApp compatibility

Architecture:

```
Communication Core (Conversation + Message)
        ↓
Communication events
        ↓
Delivery adapters: in_app | push | email | sms | whatsapp
```

WhatsApp is a **delivery channel**, never the system of record.

### 7. Separation from comments and channels

| Surface | Role |
|---------|------|
| Content comments (ADR-028) | Public discussion on posts — KEEP separate |
| Contextual Conversation (this ADR) | Coordination about an entity |
| Channels (ADR-035) | Organization / discovery — not ChatRooms |

---

## SaaS ownership

| Layer | Responsibility |
|-------|----------------|
| A Platform Core | Contracts, adapters, events, delivery ports, future ConversationRepository |
| B Shared Product | Reusable conversation UI patterns (extract over time) |
| C Tenant Configuration | Module/feature enablement |
| D Tenant Content | Demo catalogs and demo_session stores only |

If Life Panoramica disappears, Core communication capabilities remain.

---

## Consequences

### Positive

- One reusable communication model for every community  
- Clear anti-WhatsApp boundary  
- Housing / service_request extension points without premature product surfaces  

### Follow-ups

- Implement Platform `ConversationRepository`  
- Wire NotificationProvider to communication events  
- Extract shared conversation UI into packages/ui  
- Optional Channel host via `channelId` without ChatRoom  

---

## References

- `packages/types/src/platform/communication/*`
- ADR-019, ADR-028, ADR-035, ADR-039, ADR-041  
- Spec `11_CONVERSATION.md`, `12_NOTIFICATION.md`
