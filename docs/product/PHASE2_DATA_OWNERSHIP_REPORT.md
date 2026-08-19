# Phase 2 — Database reality + RLS + data ownership

**Date:** 2026-08-19  
**Status:** Implemented in this change set. Apply SQL with `supabase db push` / `supabase migration up` on the target project.

---

## Executive summary

Identity from Phase 1 is now backed by a real data plane:

```
User → Session → Membership → Tenant → RLS → Domain Data
```

PostgreSQL is the production source of truth. `.data/` JSON is a **development fixture** and is disabled when `NODE_ENV=production` or `LCOS_AUTH_REQUIRED=true`. Session membership is resolved from the database when Supabase is configured. Locations carry `tenant_id` + ownership. Conversations, reservations, housing, and catalogs persist as tenant-owned documents. RLS policies key off **JWT membership** (`auth.uid()` → identities → memberships.tenant_id) so isolation holds on each PostgREST call, not only on a session GUC.

Life Map visual, MapLibre, Territory Objects, UX, and navigation were not modified.

---

## Final data model

### Identity

| Table | Ownership |
|-------|-----------|
| `persons` | Human identity. No `tenant_id` (ADR-010). |
| `identities` | `provider_reference` → `person_id`. Security platform. |
| `memberships` | `person_id`, **`tenant_id`**, `territory_id`, `membership_type` (role), `status`. |

Roles: `member` | `group_manager` | `moderator` | `administrator`.

### Location (map SoT)

`locations`: `id`, `tenant_id`, place fields, **`owner_id`**, **`created_by`**.  
LocalEntity remains a view. No parallel place table.

### Operational documents (P1/P2)

`tenant_documents`: PK `(tenant_id, doc_key)`, `payload jsonb`, `updated_by`.

Keys: `durable:{reservations,*-conversations,...}`, `catalog:{community,experiences,marketplace,resources}`, `housing:state`.

---

## Migrations created

- `supabase/migrations/20260819160000_phase2_data_ownership_rls.sql`

---

## RLS

- `app_bind_request_context(person, tenant)` — verifies active membership; SQL-session GUCs.
- `app_resolve_identity_memberships(provider_reference)` — list memberships before bind.
- JWT policies: `app_user_has_tenant` / `app_jwt_membership_role` so REST calls isolate without carrying GUCs across HTTP.
- Locations: FORCE RLS; SELECT respects visibility; UPDATE/DELETE owner or staff.
- `app_set_tenant_context` remains **ungranted** to clients (no tenant spoof RPC).

---

## Tests (mandatory cases)

1. Panorámica member reads Panorámica → allow  
2. Panorámica member reads Valley → deny  
3. No membership → mutations unauthorized  
4. Administrator can manage locations  
5. Member cannot mutate catalog / others’ locations  
6. Owner can mutate own location  

---

## Remaining risks

- SQL must be applied on the live Supabase project; this repo change does not mutate remote schema by itself.
- File `person-*` ids are not UUID; memberships are **not** copied from `.data` (join/register creates real persons). Locations/catalogs/durable import: `pnpm --filter @life-community-os/web migrate:files`.
- Anonymous public map reads still use the trusted Next.js server + `tenant_id` filter (service role). JWT member traffic uses RLS.
- P2 domains (housing/catalog) use JSON documents, not fully normalized aggregates.
- First catalog GET may still seed from tenant packs into `tenant_documents` when empty (seed input, not a second SoT).
