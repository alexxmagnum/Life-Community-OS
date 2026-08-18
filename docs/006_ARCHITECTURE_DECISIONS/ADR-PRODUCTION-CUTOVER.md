# ADR — Production cutover checklist

## Status

Accepted — 2026-08-18  
Updated — 2026-08-18 (commercial pilot closure)

## Context

The platform spine is multi-tenant and membership-backed. Local `.data/` + optional Supabase service role are the current persistence paths. Commercial cutover must flip enforcement without inventing parallel architecture.

## Decision — required before treating an environment as production

1. Provision Supabase project; apply all `supabase/migrations`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Set `LCOS_AUTH_REQUIRED=true` so middleware and mutation gates reject anonymous access.
4. Do **not** set `NEXT_PUBLIC_LCOS_DEMO_ROLES` in production.
5. Do **not** set `NEXT_PUBLIC_LCOS_DEMO_PLACE_PROFILES` unless intentionally shipping demo copy.
6. Prefer user-scoped Supabase clients + `bindTenantRlsContext` for reads that must honor RLS; keep service role only for trusted server bootstrap (membership ensure, admin ops).
7. Migrate `.data/catalog`, `.data/locations`, `.data/memberships`, `.data/durable` into Postgres tables (or keep file store only for single-node staging).
8. Smoke two tenants (`life-panoramica`, `life-valley`): login → membership → catalog → map → location ficha → admin role change.
9. Confirm Home / Discover / Services deep-links use `/map?focus=<Location.id>` (not raw LocalEntity ids).

## Pilot already closed (no new architecture)

- Map visual lock is map-first (MapLibre + Location SoT).
- Pin → premium context card → ficha / directions / contact.
- Business register → geocode → public Location → map focus.
- Admin/moderator manage ficha via Location PATCH.
- When `LCOS_AUTH_REQUIRED=true` + auth configured: anonymous `/api/locations|catalog|durable|housing|geocode` are blocked by middleware.

## Non-goals for this cutover

- Rewriting AuthZ capability matrices away from role→capability maps
- Replacing MapLibre / Location SoT
- Realtime conversation servers (durable JSON is the interim SoT)

## Consequences

Until steps 1–6 are applied, the product remains a **commercial-ready pilot** (honest multi-tenant demo with durable APIs), not a locked-down multi-region SaaS.
