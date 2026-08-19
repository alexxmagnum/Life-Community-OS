# Business Platform Audit — Phase 5.1

**Date:** 2026-08-19  
**Scope:** Convert commercial registration from a demo/pilot flow into a tenant-owned Business Profile domain, with Location remaining the map Source of Truth.

Do not treat this document as a parallel architecture. The product relation is:

```
Person / Company → Business Profile → Location → Ownership → Publication → Discovery
```

---

## What already works

- **Registration UI exists.** `BusinessRegistrationScreen` collects name, category, type, address, contact, description, and hours; geocodes via `/api/geocode`; then persisted a Location.
- **Location is already the map SoT.** Coordinates, address, category, and visibility live on `locations`. Life Map objects are a projection of Location. LocalEntity is a view, not a store.
- **Location APIs exist.** `GET/POST /api/locations`, `GET/PATCH/DELETE /api/locations/:id`. PATCH already preserves `ownerId` / `createdBy` and does not accept a client-owned swap.
- **Location ownership helpers exist.** Owner or tenant staff may mutate; catalog/unowned places are protected from members.
- **Discovery already reads Location** on Discover, Nearby, and the map (`useTenantLocations` → `GET /api/locations`).
- **Ficha exists.** `LocationDetailScreen` shows name, summary, hours, contact, address, and map/contact actions.
- **Admin lists tenant locations** and can open a ficha. Staff can PATCH/DELETE locations.
- **RLS + tenant bind** from Phases 1–3 apply to Location writes (`resolveWriteTenantId`, mutation actor, Postgres when configured).

---

## What is demo / pilot

| Leak | Where | Effect |
| --- | --- | --- |
| No Business Profile | Types, DB, APIs | Identity of a business is the Location row itself |
| Immediate public publish | Registration sets `visibility: "public"` | No draft / review / suspend workflow |
| Client may send `ownerId` on Location POST | `saveLocationServer` prefers `input.ownerId` | Ownership spoof possible on create |
| IKON lifestyle cluster | `example-ikon.ts` via `useTenantLocations` | Runtime invents restaurants/services |
| Catalog commercial seed | `seed-catalog-locations.ts` (`lp-ikon`, shops, services) | Demo businesses appear on the map |
| Demo ficha fill | `demoPlaceProfileFor` in `LocationDetailScreen` | Fake hours/contact/image when Location is empty |
| Services hub catalog | `ServicesCategoryScreen` → `listLocalEntitiesForKinds` | Mock cards, not Location + Business |
| Professionals stub | `ProfessionalTradeStubScreen` | “Pronto” empty state, no domain |
| Admin “Publicar lugar” | Admin CTA → register → public Location | Skips moderation |
| Placeholder copy | Registration placeholder “IKON Sports & Lounge” | Demo naming in the product flow |

`localStorage` on the client is only a Location cache (`lcos.locations.cache.v2`), not a business SoT. File fixture `.data/locations` is a **dev data plane**, not product ownership.

There is **no** hardcoded Marta identity in the business/location path (Community Core already removed that). Runtime commercial identity is still “whoever created a public Location”, not a first-class owner with publication states.

---

## What is missing

1. **Business Profile** as commercial identity (`id`, `tenant_id`, `owner_person_id`, `name`, `category`, `description`, `contact`, `status`).
2. **Location.business_id** so the map place points back to the profile without duplicating coordinates.
3. **Server-assigned ownership.** Session + membership + person id. Never `owner_id` from the frontend.
4. **Publication machine:** `draft → pending_review → published → suspended → archived`.
5. **APIs:** `POST/GET /api/businesses`, `GET/PATCH /api/businesses/:id`, `POST .../publish`, `POST .../review`.
6. **Discovery of published businesses only** on the map (unpublished Location stays `private`).
7. **Professional trades** as the same domain + category (no `ProfessionalEntity`).
8. **Admin queue** for pending review, approve, suspend, and ownership visibility — tenant-scoped.
9. **Tests 1–7** for create, foreign edit, admin publish, tenant isolation, Location tenant, map visibility, owner spoof.

---

## What must migrate

| From | To |
| --- | --- |
| Register → `POST /api/locations` public | Register → `POST /api/businesses` draft + private Location |
| Location-only commercial identity | Business Profile (who) + Location (where) |
| Staff-only ficha edit | Owner or staff via Business PATCH (syncs Location fields, not coords) |
| Instant map pin | Map pin only after moderator/admin publish |
| IKON / catalog restaurants as runtime businesses | No commercial demo seed; facilities/pack seeds may remain as community places |
| Services / professionals mock catalogs | Published Location + Business Profile filtered by category |
| Admin “publish place” | Admin reviews `pending_review` and publishes |

**Non-goals (do not touch):** Life Map renderer, MapLibre, Territory Objects, Tenant Factory, Auth Foundation, Community Core tables.

**Invariant:** Coordinates live only on Location. Business Profile never stores latitude/longitude.
