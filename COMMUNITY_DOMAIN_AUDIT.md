# COMMUNITY_DOMAIN_AUDIT.md

**Phase:** 4 — Community Core real domain  
**Date:** 2026-08-19  
**Constraint:** Do not touch Life Map, MapLibre, Territory Objects, Location SoT, Tenant Factory, Auth foundation, or RLS foundation.

---

## What exists

Community is a **product surface** with domain types and a Belong hub, but persistence is **not** a first-class SaaS domain.

| Surface | Today |
|---------|--------|
| Feed / posts | Pack catalogs + `catalog:community` JSON + localStorage / `durable:community-interactions` |
| Groups | Hardcoded `groupCatalog` (Panorámica) when `homeMode === "premium"` |
| Events | Experience catalog (pack / catalog JSON), not a community event table |
| Comments / reactions / saves | Client overrides in localStorage + durable blob |
| Conversations | Pack stores + durable JSON keys |
| Notifications | Empty inbox ports — no tenant-scoped records |
| Identity | Session `CurrentUserContext` exists; UI still attributes via `demoMember` / Marta |

Postgres already has: `tenants`, `persons`, `memberships`, `community_areas`, `tenant_documents`. **Do not duplicate those.**

---

## What is demo

- Default identity `person-marta` / Marta Ruiz when demo roles are on.
- `narrativeKey: "marta"` even on real memberships.
- `listPublishedCommunityContent()`, `listGroups()`, `listActiveCommunityAlerts()` as **runtime** content for premium home.
- Fake authors (Ana, Carlos, Elena, …) in pack catalogs used as live neighbours.
- `lcos:community-interactions` and `lcos.unread.*` localStorage.
- Create/comment attribution from `demoPersonId`, not from the session.

Allowed to remain as **development fixtures / packs** — never as production source of truth.

---

## What is missing

- Tables: groups, posts, events, comments, notifications (P0); reactions, saves (P1).
- APIs: feed, create post, groups, events — with session + membership + tenant + permission.
- Server-side moderation (member cannot hide; moderator can).
- Notification records scoped by `tenant_id` + `recipient_person_id`.
- UI that reads the community domain instead of pack fallbacks.

---

## What must migrate

| From | To |
|------|----|
| Pack feed fallback | `community_posts` via `/api/community/feed` |
| localStorage created posts | `POST /api/community/posts` (`created_by` = session person) |
| `listGroups()` | `community_groups` via `/api/community/groups` |
| Experience catalog as “events” | `community_events` (seed only in development) |
| Empty notification ports | `community_notifications` |
| `demoMember` on Community | `CurrentUserContext` |

Conversations stay on existing durable documents this phase (do not invent a parallel chat store). Location / Life Map untouched.
