# TENANT_FACTORY_AUDIT.md

**Phase:** 3 — Tenant factory + white-label foundation  
**Date:** 2026-08-19  
**Constraint:** Do not touch Life Map renderer, MapLibre, Territory Objects, Location SoT, Auth, or RLS.

---

## Before

Tenants existed as **development packs wired in product code**:

| Tenant | Pack | How it is special |
|--------|------|-------------------|
| `life-panoramica` | Full catalogs, nav, demo members, Life Map | Default fallback; dozens of `=== "life-panoramica"` branches; direct pack imports in screens |
| `life-valley` | Theme + features only | Catalog/location seeds inlined in `apps/web`; host `if` in resolver |

Adding a third community required changing core allowlists, bootstrap `if` trees, and screen gates. That is not a white-label platform.

---

## After

| Tenant | Identity | Home | Capabilities (distinct) |
|--------|----------|------|-------------------------|
| `life-panoramica` | Manifest row (default fallback) | `premium` | golf, hospitality, marketplace, housing, lifeMap |
| `life-valley` | Manifest row | `catalog` | no golf / hospitality |
| `life-ocean-hills` | Manifest row | `catalog` | hospitality; **no** golf, marketplace, housing, lifeMap |

Product screens gate modules with **`isProductCapabilityEnabled`** / **`homeMode`**, not customer slugs.

Zero remaining `tenantSlug === "life-…"` branches in `apps/web/src`.

---

## Resolution flow (kept)

```
Request (header / cookie / host hints / env)
  → sanitize allowlisted slug (manifest)
  → Tenant pack (configuration)
  → branding / capabilities / catalog seeds
  → APIs bind membership → tenant → RLS (Phase 2)
```

Identity UUIDs remain in the **tenant manifest** (not invented per screen). RLS still uses `tenantSlugToUuid`.

---

## Hardcodes classified

| Class | Examples | Phase 3 action |
|-------|----------|----------------|
| **Identity map** | `ids.ts` slug↔UUID | Drive from **manifest**. Keep panoramica/valley UUIDs. |
| **Registry** | `registry.ts` `registerPack` calls | Register from **pack catalog**. |
| **Product if-slug** | Home, Community, Discover, bootstrap-catalog, seed locations | Replace with pack `homeMode` / `getCatalogSeed` / product capabilities |
| **Direct panoramica imports** | MemberShell nav projector, conversation helpers, premium catalogs | Leave pack-specific **content modules** in the panoramica pack; screens that already use CatalogProvider stay generic. Premium extras gated by `homeMode === "premium"`. |
| **Seed content** | Pack catalogs, Valley arrays in web | Move seeds **into the tenant pack** |
| **Life Map** | `life-map-tenant-registry.ts`, renderer | **Do not touch** |

---

## Target contract

```
Tenant {
  id, slug, name,
  branding, locale, timezone, territory,
  capabilities, assets, configuration
}
```

Type: `TenantContract` in `@life-community-os/types`. Runtime: `resolveTenantContract(slug)`.

Product modules (not AuthZ):

`golf | hospitality | marketplace | reservations | experiences | housing | community | resources | lifeMap | work | official`

UI shows a module when **capability is enabled**, never when `tenant === panoramica`.

---

## Factory rule

**Core** (ids, APIs, screens) must not grow a new `if (slug === "life-…")`.

**To add a customer:**

1. Tenant pack under `tenants/<slug>/` (branding, capabilities, seeds).
2. One row in the **manifest** (identity + host hints).
3. One registration in the pack catalog (`registry.ts`).
4. Workspace / transpile wiring (Next.js constraint).
5. SQL seed for `public.tenants` / `public.territories`.

No new screens. No new core branches.

Admin foundation: `GET /api/admin/tenants` + `planTenantProvision` (does not write files).

---

## Isolation

Catalog seeds, locations, and branding belong to `tenant_id` / pack slug. Panorámica content must not appear in Valley or Ocean Hills.
