# Housing Domain Audit — Phase 7.1

**Date:** 2026-08-19  
**Scope:** Convert Housing from classified-ad demo into a tenant-owned residential domain.

Housing already has a **listing** product (rent/sale ads) and a **foundation** Property model (ADR-007 / ADR-008). This phase must not invent a third entity. Property is the dwelling. PropertyPersonRelationship is residency. Location stays the geographic SoT. A dwelling is not a Business Profile.

---

## What exists

| Layer | Reality |
| --- | --- |
| ADR-007 `Property` | Stub: `id`, `addressId`, `unitLabel`, `name`. Used by residency demo graph. |
| ADR-008 `PropertyPersonRelationship` | Owner / resident / tenant / family_member (plus guest, staff). Not wired to Housing UI. |
| SQL `properties` | UUID rows, `address_id` required, types `residential\|commercial\|…`, **no `tenant_id`**, RLS via Address → Territory. |
| SQL `property_person_relationships` | UUID `person_id` FK to `persons`. RLS via Property → Address. |
| Product UI | Explore / Mine / Create / Detail / Saved — **HousingListing** classified ads. |
| API `GET/PUT /api/housing` | Blob of `created` + `overrides` + `contacts` in `tenant_documents`. |
| Location | Map SoT from Phase 5. Housing listings do **not** create Location rows. |

Capabilities already exist: `housing.view`, `housing.create_own_listing`, edit/save/contact/manage.

---

## What is demo / runtime leak

| Surface | Source |
| --- | --- |
| Explore list | `housingSeedCatalog` (Unsplash, fake Elena / Jordi / Luis / Ana / Marta) |
| Create | `createHousingListing` → localStorage `lcos.housing.created.v1` + PUT blob. `createdByPersonId: demoMember.personId` |
| Mine / Detail / Contact | `demoMember.personId` as owner and contact actor |
| Default photo | Unsplash loft URL |
| Tenant id on seeds | `"demo-tenant"` |
| Saved | localStorage + durable key (ids of seed listings) |
| Profile “Mi hogar” | `getMyHomeContext(demoPersonId)` + residency demo narratives |
| Conversations | Housing adapter still listing-shaped |

There is **no** Property create API. Ownership of ads is a field on the listing, not a residency relationship. Owner is assumed to be the publisher.

---

## What is missing

1. **Property** as residential identity: `tenant_id`, `location_id`, `created_by`, type (`villa\|apartment\|townhouse\|plot\|other`), status (`draft\|active\|inactive\|archived`).
2. **PropertyMembership** = existing `PropertyPersonRelationship` (no new table name in the type system). Owner ≠ resident.
3. **Privacy projection**: public list must not leak owner, residents, or family.
4. **Location link**: Property → Location (address + coordinates). Not a business pin.
5. **Tenant-scoped RLS** on `tenant_id` so Valley cannot read Panorámica even without an Address row.
6. **REST**: GET/POST `/api/housing`, GET/PATCH `/api/housing/:id`, POST `/api/housing/:id/members`.
7. **UI** bound to session `personId`, not `demoMember`.
8. **Tests 1–7**.

---

## What must migrate

| From | To |
| --- | --- |
| HousingListing seed + localStorage | `Property` rows |
| `demoMember` as owner | session `personId` + owner membership |
| Unsplash product images | optional member-supplied URLs (none required) |
| PUT housing blob | resource APIs |
| Profile demo home | `GET /api/housing?mine=1` |
| Address-only isolation | `tenant_id` + Location |

**Keep:** HousingListing types/lifecycle/config (tenant module knobs). They are not the runtime catalog.

**Non-goals:** Life Map, MapLibre, Territory Objects, Tenant Factory, Auth Foundation, Community Core schema, Business Profile schema. No `ProfessionalEntity`. No housing-as-business.

**Future (7.9):** Property may store optional Community Core ids (group/resource) later. This phase only reserves the shape — no duplicated events or amenities.
