# Phase 4 — Community Core real domain

**Date:** 2026-08-19  
**Status:** Implemented. Apply SQL with `supabase db push` / `supabase migration up` on the target project.

---

## Executive summary

Community is now a tenant-owned SaaS domain:

```
Person → Membership → Community Core → Content / Interactions
```

Posts, groups, events, comments, reactions, saves, and notifications persist with `tenant_id` + `created_by`. APIs require session, membership, tenant bind, and permission. Production no longer falls back to Marta or pack catalogs as live identity/content.

---

## Domain model

One tenant = one community. Tables:

| Table | Purpose |
|-------|---------|
| `community_groups` | Groups (vecinos, deporte, …) |
| `community_posts` | Feed publications |
| `community_events` | Scheduled activities |
| `community_comments` | Comments on posts/events |
| `community_notifications` | Tenant-scoped inbox |
| `community_reactions` | P1 reactions |
| `community_saves` | P1 saved content |

Ownership fields: `tenant_id`, `created_by`, `created_at`, `updated_at`. Author never comes from the client body.

---

## APIs

- `GET /api/community/feed`
- `POST /api/community/posts`
- `POST /api/community/posts/:id/moderate` (moderator/administrator)
- `GET|POST /api/community/groups`
- `GET|POST /api/community/events`
- `POST /api/community/comments`
- `POST /api/community/reactions`
- `GET|POST /api/community/notifications`

---

## Demo removed from runtime

- TenantProvider no longer defaults to Marta.
- Membership profiles use `CurrentUserContext`.
- Community feed/create/comment use the Community API + session person.
- Pack catalogs remain **development fixtures**, not production fallbacks.

---

## Remaining risks

- Group/neighbour **conversations** still use durable JSON + pack stores (not migrated this phase).
- Premium hub still uses pack catalogs for alerts, channels, and official entities.
- SQL must be applied on the live Supabase project.
- Housing / marketplace screens still accept `demoMember` as a CurrentUser-shaped alias.
