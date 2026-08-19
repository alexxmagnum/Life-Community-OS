# DATA_PERSISTENCE_AUDIT.md

**Phase:** 2 — Database reality + RLS + data ownership  
**Date:** 2026-08-19  
**Scope:** users, persons, memberships, locations, catalog, community, conversations, housing, reservations, marketplace, experiences  
**Constraint:** Location remains the map Source of Truth. No parallel LocalEntity store. Life Map visual / MapLibre / Territory Objects unchanged.

---

## Architecture target

```
User → Session → Membership → Tenant → RLS → Domain Data
```

PostgreSQL (Supabase) is the production source of truth.  
`.data/` JSON files are **development fixtures only**. They must not run in production.

---

## Classification

| Class | Meaning | Allowed in production? |
|-------|---------|------------------------|
| **DB SoT** | Postgres table + RLS | Yes |
| **Dev fixture** | `apps/web/.data/*` when DB is not configured and `NODE_ENV !== production` | No |
| **Pack content** | Tenant TypeScript packs (Life Map, copy, navigation) | Yes, as product configuration — not operational state |
| **Forbidden runtime** | localStorage / sessionStorage / in-memory / demo identity as SoT | No |

---

## Domain audit

### users

| | |
|--|--|
| **Where truth lives today** | Supabase Auth (`auth.users`) when configured. Local cookie `lcos-local-identity` (`local:{tenant}:{email}`) when Auth is not configured. |
| **Where it should live** | Authentication provider (Supabase Auth). Local-join is a development fixture, not a production identity plane. |
| **Phase 2 action** | Unchanged Auth foundation. Production data plane requires configured DB; local file identity cannot be production SoT. |

### persons

| | |
|--|--|
| **Where truth lives today** | Dual: `public.persons` (service-role insert on join) **and** `apps/web/.data/memberships/{slug}.json` identities with synthetic `person-*` ids. Session listing used **file only**. |
| **Where it should live** | `public.persons` (`id`, display fields, `created_at`, `updated_at`). Person has no `tenant_id` (ADR-010). Tenant visibility is relationship-derived via Membership. |
| **Phase 2 action** | Resolve Person from DB by `identities.provider_reference`. File identities only when file persistence is allowed. |

### memberships

| | |
|--|--|
| **Where truth lives today** | File store is what the session reads. DB rows exist after `ensureSupabaseMembership` but are unused for resolution. Roles live in `memberships.membership_type`. Isolation is via `territory_id` → `territories.tenant_id`. |
| **Where it should live** | `public.memberships`: `person_id`, `tenant_id`, `territory_id`, `membership_type` (role: `member` \| `group_manager` \| `moderator` \| `administrator`), `status`. Every resolution from DB when the database is configured. |
| **Phase 2 action** | Add `tenant_id` (backfilled from territory). List/update memberships from Postgres. File store is a fixture fallback only. |

### locations

| | |
|--|--|
| **Where truth lives today** | `public.locations` **if** service role succeeds; always mirrored to `.data/locations/{slug}.json`. No `owner_id` / `created_by`. RLS enabled but **not FORCE**; app uses service role (bypasses RLS). |
| **Where it should live** | `public.locations` with mandatory `tenant_id`, `owner_id` / `created_by` when a member creates a place. Location remains the single map SoT. LocalEntity stays a **view**, never a second store. |
| **Phase 2 action** | Ownership columns, FORCE RLS, visibility-aware SELECT, repository writes DB-first and never writes `.data` in production. |

### catalog (community / experiences / marketplace / resources)

| | |
|--|--|
| **Where truth lives today** | `.data/catalog/{slug}/{domain}.json`, seeded from tenant packs on first read. |
| **Where it should live** | Tenant-owned documents: `tenant_documents` keyed by `(tenant_id, catalog:{domain})`. Packs remain **seed input**, not runtime SoT once persisted. |
| **Phase 2 action** | P2 persistence via `tenant_documents`. Pack bootstrap writes to DB when configured. |

### community

| | |
|--|--|
| **Where truth lives today** | Pack catalogs + `.data/catalog/.../community.json` + session/local UI cache. |
| **Where it should live** | Same as catalog (`catalog:community`) under tenant RLS. Interactions that must survive (P1) go to `durable:community-interactions`. |
| **Phase 2 action** | Catalog + durable documents. No new Community SQL schema in this phase (avoids a parallel domain model). |

### conversations

| | |
|--|--|
| **Where truth lives today** | `.data/durable/{slug}/*-conversations.json` plus client localStorage cache. |
| **Where it should live** | `tenant_documents` keys `durable:{place,marketplace,experience,group,neighbour,official,work}-conversations`. `tenant_id` + `updated_by`. |
| **Phase 2 action** | P1 — durable store reads/writes Postgres when configured. |

### housing

| | |
|--|--|
| **Where truth lives today** | `.data/housing/{slug}.json` + client localStorage. |
| **Where it should live** | `tenant_documents` key `housing:state` until a first-class Housing aggregate is designed (ownership still product-pending). Always `tenant_id`. |
| **Phase 2 action** | P2 document persistence. GET requires membership (no anonymous housing dump). |

### reservations

| | |
|--|--|
| **Where truth lives today** | `.data/durable/{slug}/reservations.json`. |
| **Where it should live** | `tenant_documents` key `durable:reservations`. |
| **Phase 2 action** | P1 with other durable keys. |

### marketplace / experiences

| | |
|--|--|
| **Where truth lives today** | Tenant packs + `.data/catalog/...` + durable conversation blobs. |
| **Where it should live** | Catalog documents + durable conversation documents. No LocalEntity table. |
| **Phase 2 action** | Covered by catalog + durable. |

---

## Infrastructure findings (before Phase 2)

1. **Service role is the live write path** — RLS policies exist and fail closed on unbound `app.tenant_id`, but `app_set_tenant_context` is not granted to `authenticated`, and repositories never bind GUC. Policies therefore do not protect the application.
2. **Session membership is file-sourced** — `listMembershipsForAuthUser` ignores Postgres.
3. **Dual write** — locations and memberships always update `.data` even after a successful DB upsert.
4. **Locations RLS is not FORCE** — table owner can skip policies.
5. **No location ownership** — cannot express “member updates own place / cannot update catalog places”.
6. **Membership has no `tenant_id` column** — tenant is only via territory join. Required for explicit SaaS ownership.
7. **Anonymous vs member reads** — public locations of the host tenant remain readable; member/private rows must not leak. Authenticated users without membership must not mutate and must not read housing/durable member data.

---

## RLS bind model (Phase 2)

Trusted RPCs (SECURITY DEFINER), not an open `app_set_tenant_context` grant:

| Function | Who | Effect |
|----------|-----|--------|
| `app_bind_request_context(person_id, tenant_id)` | `authenticated` | Verifies **active membership**. Sets `app.tenant_id`, `app.person_id`, `app.territory_id`, `app.membership_role`. JWT callers may only bind their own Person. |
| `app_bind_public_tenant(tenant_id)` | `anon`, `authenticated` | Sets tenant GUC only. SELECT policies then allow **public** location rows for that tenant. |
| `app_resolve_identity_memberships(provider_reference)` | `authenticated`, `service_role` | Cross-tenant membership listing keyed by identity. JWT callers may only resolve `auth.uid()`. |

Service role remains for **bootstrap only** (create Person / Identity / first Membership). User data access prefers the JWT + bind path. Application still filters `tenant_id` (defense in depth).

---

## Isolation cases (must hold)

| # | Case | Result |
|---|------|--------|
| 1 | User A, membership Panorámica, reads Panorámica | Allow |
| 2 | User A attempts Valley | Deny |
| 3 | User without membership | Deny mutations and member data |
| 4 | Administrator manages tenant (directory, catalog, location delete) | Allow |
| 5 | Member cannot modify protected content (unowned / others’ locations, catalog PUT) | Deny |
| 6 | Location ownership: owner or staff may update; others denied | Enforce |

---

## What Phase 2 will not do

- Change Life Map rendering, MapLibre, Territory Objects, 3D assets, UX, or navigation.
- Invent a second place entity (`LocalEntity` as persistence).
- Replace Tenant / Auth / Membership product contracts.
- Treat tenant TypeScript packs as operational databases.
