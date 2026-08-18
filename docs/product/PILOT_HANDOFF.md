# Life Community OS — Pilot Handoff (v0.1.0-pilot)

**Status:** Release Candidate frozen for first-client demo  
**Tag:** `v0.1.0-pilot`  
**Baseline commit:** `76d4944` (+ freeze follow-ups if present)

## What this is

A **commercial pilot** of Life Community OS ready to show a first real client.

It is **not** a locked-down multi-region SaaS. Production cutover steps remain in [ADR-PRODUCTION-CUTOVER.md](../006_ARCHITECTURE_DECISIONS/ADR-PRODUCTION-CUTOVER.md).

## Architecture (current — do not reinvent)

| Concern | Authority |
|---------|-----------|
| Tenants | Packs `life-panoramica`, `life-valley` + `TenantConfiguration` |
| Places | **Location SoT** (`/api/locations`, map focus `/map?focus=`, ficha `/locations/[id]`) |
| Auth | Supabase Auth + memberships; gates via `LCOS_AUTH_REQUIRED` |
| Memberships / roles | member · group_manager · moderator · administrator |
| Map | MapLibre self-hosted GeoJSON; hybrid Three **off** by default |
| Catalogs | Tenant-scoped community / experiences / marketplace / resources |
| Persistence (pilot) | `apps/web/.data/*` + optional Supabase |

## Demo scripts

### Resident

1. `/register` or Perfil → unirse a la comunidad  
2. `/login` (when Supabase configured)  
3. Home → Discover → Mapa  
4. Seleccionar Location → ficha → contactar / cómo llegar  

### Business

1. `/business/register`  
2. Nombre + dirección → geocode (`GET /api/geocode`) → publicar  
3. Aparece en mapa → gestionar ficha (moderator/admin)  

### Admin

1. Primer membership vacío → administrator (local-join)  
2. `/admin` → miembros, roles, Locations  

### Tenants

| Tenant cookie / slug | Expect |
|----------------------|--------|
| `life-panoramica` | Solo catálogo / locations `lp-*` / pack Panorámica |
| `life-valley` | Solo `lv-*` (plaza, café, paseo, bienvenida) |

Isolation smoke: `pnpm --filter @life-community-os/web test:isolation`

## Client-demo environment (local / staging)

```bash
# Required for product demo
NEXT_PUBLIC_DEFAULT_TENANT_SLUG=life-panoramica

# Must stay OFF for client demos
# NEXT_PUBLIC_LCOS_DEMO_ROLES=1
# NEXT_PUBLIC_LIFE_MAP_DEV=1
# NEXT_PUBLIC_LIFE_MAP_3D=1

# Optional presentation fill (local only; prefer Location enrichment)
# NEXT_PUBLIC_LCOS_DEMO_PLACE_PROFILES=1
```

## Production cutover (before treating as production)

1. Apply `supabase/migrations/*`  
2. Set Supabase URL + anon + service role  
3. `LCOS_AUTH_REQUIRED=true`  
4. Leave `NEXT_PUBLIC_LCOS_DEMO_ROLES` unset  
5. Leave `NEXT_PUBLIC_LCOS_DEMO_PLACE_PROFILES` unset (production defaults off)  
6. Prefer `SUPABASE_USE_RLS=1` for user-scoped reads  
7. Migrate `.data/` into Postgres (or keep file store for single-node staging only)  
8. Smoke both tenants end-to-end  

## Push (when ready)

```bash
git push origin main
git push origin v0.1.0-pilot
```

## Explicit non-goals

- New architecture layers  
- Rewriting Location / Auth / Map contracts  
- Shipping `/dev/*` tooling to clients (404 in production)
