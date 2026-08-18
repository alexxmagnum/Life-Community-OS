# ADR — Multi-tenant isolation runtime

## Status

Accepted — 2026-08-18

## Context

Life Community OS must operate as a platform (2+ tenants) with isolated catalogs, durable state, locations, and memberships. Service-role DB clients bypass RLS; file stores are tenant-keyed.

## Decision

1. Every request resolves `tenantSlug` via header / cookie / host / env (`resolveRequestTenantSlug` + middleware `x-tenant-slug`).
2. Product catalogs (community, experiences, marketplace, resources) persist under `.data/catalog/{tenant}/` and are consumed via `/api/catalog` + `CatalogProvider`.
3. Durable provider state and housing sync are keyed by active tenant (never hard-coded to Panorámica).
4. Panorámica place seeds must never write into other tenants; Valley has its own location + Life Map pack.
5. Membership roles persist (file + Supabase when available). Demo `setRole` is development-only / opt-in.
6. Admin membership APIs require `administrator`. Location PATCH/DELETE require moderator/administrator.
7. `bindTenantRlsContext` is the helper for binding `app_set_tenant_context` on non–service-role clients when Supabase user-scoped queries are introduced.

## Consequences

- Switching tenant cookie changes content, durable keys, and map pack.
- Full Postgres RLS enforcement still requires anon/authenticated clients with GUC binding (service role remains trusted server path).
- Remaining pack imports are fallbacks for helpers (labels, formatters) — list SoT is catalog API.
