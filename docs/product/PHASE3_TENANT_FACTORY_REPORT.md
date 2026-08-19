# Phase 3 — Tenant factory + white-label platform foundation

**Date:** 2026-08-19  
**Status:** Implemented. Apply Ocean Hills SQL with `supabase db push` / `supabase migration up` on the target project.

---

## Executive summary

Life Community OS can now host a new community without changing product screens or adding `if (tenant === …)` branches.

```
Manifest (identity)
  → Pack (branding, capabilities, catalogs, locations)
  → Product (homeMode + isProductCapabilityEnabled)
  → RLS (Phase 2)
```

Panorámica and Valley remain working. Ocean Hills Community (`life-ocean-hills`) proves the platform is not Panorámica-shaped: different brand, locale (`en`), catalogs, locations, and disabled marketplace / golf / housing / Life Map.

---

## Tenant contract

`TenantContract` (`@life-community-os/types`):

- `id`, `slug`, `name`
- `branding` (name, logo text, tagline, primary color, imagery)
- `locale`, `timezone`
- `territory` (`id`, `name`)
- `capabilities` (`ProductCapabilityMap`)
- `assets` (catalog domains, location seed mode)
- `configuration` (`homeMode`, host hints)

Runtime: `resolveTenantContract(slug)` in `apps/web/src/lib/tenant/admin-tenant.ts`.

Identity SoT: `apps/web/src/lib/tenant/manifest.ts`.

---

## Architecture

1. **Core brand** = Life Community OS (chrome, design system, product modules).
2. **Tenant brand** = pack theme + identity (Panorámica / Valley / Ocean Hills).
3. **Capabilities** drive module visibility. AuthZ capabilities (`CAPABILITIES.*`) remain separate.
4. **Content** is pack-seeded and stored under `tenant_id` (Phase 2 documents + locations).

Factory checklist for a fourth customer: pack folder + manifest row + `registerPack` + workspace/transpile + SQL seed. No new product screens.

---

## Tests

1. Panoramica loads only Panoramica catalogs/brand.
2. Valley loads only Valley (`lv-` seeds).
3. Ocean Hills loads only Ocean Hills (`oh-` seeds, own locations).
4. Unknown slug rejected; Panoramica member cannot read Ocean Hills.
5. Disabled capability hides marketplace (Ocean Hills) and golf (Valley).
6. Branding (name + primary color) does not leak across tenants.

---

## Remaining risks

- Next.js still needs an explicit workspace dependency + `transpilePackages` entry per pack (not runtime discovery).
- Premium Home extras still import Panorámica content modules, gated by `homeMode === "premium"`.
- Housing demo seed listings in `apps/web` are not per-pack; they stay behind the housing capability.
- Life Map pack registry was not extended for Ocean Hills (`lifeMap: false` by design).
- Ocean Hills SQL must be applied on the live Supabase project.
