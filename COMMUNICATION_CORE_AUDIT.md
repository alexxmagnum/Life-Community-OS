# Communication Core audit (Phase 9.1)

Scope: one Conversation → Participants → Messages → Attachments core for the whole platform. Does not modify Life Map, Tenant Factory, Auth, Community Core schema, Business, Housing, or Reservation domain tables.

## What exists

### Platform contracts (ADR-043)

- `Conversation` + `ConversationContext` + `Message` in `packages/types/src/platform/communication/`
- Context adapters per module (experience, group, marketplace, place, work, housing, reservation, official, community discussion)
- Persistence **plan only**: `demo_session` → `platform_service` (`conversation-persistence.ts`)
- Attachment picker is UX foundation — no FileReference pipeline wired

### Runtime (temporary)

- Seven tenant-pack stores (`neighbour-conversations`, `group-conversations`, `marketplace-conversations`, `experience-conversations`, `place-conversations`, `official-conversations`, `work-conversations`)
- `PlaceConversationsDurableProvider` hydrates those stores from `/api/durable` + **localStorage**
- Screens call pack helpers (`postNeighbourMessage`, `postMarketplaceMessage`, …) with **`demoMember`**
- Unread cursors in localStorage (`lastSeen`)
- Access gates in `apps/web/src/lib/*-conversation-access.ts` evaluate adapters, not persisted participants

### What is missing

- PostgreSQL `conversations` / `conversation_participants` / `messages` / `message_attachments`
- RLS tenant isolation
- Session `created_by` / `sender_person_id` (never client spoof)
- One find-or-create per `(tenant, context_type, context_id)`
- Inbox of “my conversations”
- Notifications on new message via existing Community Notifications (no parallel bus)

## What must migrate

1. Stop using pack conversation stores at runtime.
2. Stop durable JSON as the message source of truth.
3. Keep adapters as **context meaning** (title, module ON/OFF) — they must not own persistence.
4. Durable blobs may seed development fixtures once; production path is Postgres + RLS.

## Target graph

```
Conversation (tenant scoped, typed direct | group | context)
  → ConversationParticipant (owner | participant | moderator)
  → Message (sender = session)
      → MessageAttachment (prepared; file pipeline later)
  → Community Notification (existing)
```

Context types (product): `community` · `business` · `reservation` · `marketplace` · `help` · `administration`  
Existing ADR types (`group`, `experience`, `official`, …) remain aliases, not separate chat engines.
