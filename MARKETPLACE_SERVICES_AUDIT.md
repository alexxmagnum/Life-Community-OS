# Marketplace + Services Audit — Phase 6.1

**Date:** 2026-08-19  
**Scope:** Convert Marketplace, Community Help, Work, and professional discovery from tenant-pack / localStorage demos into tenant-owned platform domains.

Professionals already have a real path from Phase 5 (`Business Profile` + `Location`). This phase must not create a `ProfessionalEntity`.

---

## What already works

- **Professionals listings** load published `Business Profile` rows via `GET /api/businesses` (`ProfessionalTradeStubScreen`).
- **Services → professionals (locations)** already filter Location SoT in `ServicesCategoryScreen` for `local-entities`.
- **Identity, RLS, tenant bind, mutation actor** from Phases 1–3 apply to any new API.
- **Community Core** (Phase 4) is the notification / membership pattern to copy — not a help store.
- **Business Platform** (Phase 5) is the professional identity + map presence.

---

## What is demo / pack / localStorage

| Surface | Source | Runtime leak |
| --- | --- | --- |
| Marketplace list | `useCatalogDomain("marketplace")` ← pack seed via `/api/catalog` | Sofa, bike, drill, table + Valley give seed |
| Marketplace create | `createMarketplaceListing` → `localStorage` | Never hits a domain API |
| Marketplace detail (session ids) | Pack getter fallback | Demo authors Elena / Jordi / Ana / Luis |
| Neighbour help / mobility | Filters over pack marketplace catalog | Same demo cards |
| Work board | `workPostCatalog` + `lcos.*.work-posts.created.v1` | Demo job posts |
| Work create / detail | Pack + localStorage | `createdByPersonId` from `demoMember` |
| Recommendations / trusted help (Discover) | `localRecommendationCatalog` / `localEntityCatalog` | Pack tips and fake services |
| Marketplace / work conversations | localStorage + interest lists | Not a domain |

There is **no** `/api/marketplace` or `/api/help`. Pack `MarketplaceListing` kinds (`sell/buy/give/request`) are a demo vocabulary, not the commercial domain.

---

## What is missing

1. **MarketplaceListing** in `packages/types` with `sale | rent | giveaway | exchange` and publication states.
2. **HelpRequest** (`offer_help | need_help`) tenant-owned, integrated with Community Core notifications.
3. **Server-assigned ownership** (`owner_person_id` / `created_by` from session).
4. **Postgres + RLS** tables `marketplace_listings` and `community_help_requests`.
5. **APIs** listed in Phase 6.7.
6. **UI** that reads APIs instead of catalog seeds / pack helpers.
7. **Work** as the same Help domain (no third entity): looking for work = `need_help`, offering work = `offer_help`.
8. **Tests 1–7**.

---

## What must migrate

| From | To |
| --- | --- |
| Catalog seed marketplace cards | `GET /api/marketplace` published listings |
| localStorage create | `POST /api/marketplace` (owner = session) |
| Neighbour help pack filter | `GET /api/help` |
| Work pack + LS | `POST/GET /api/help` with work categories |
| Discover trusted help pack | Published Business Profile + Location |
| Discover tips pack | Open `offer_help` requests |
| Mobility pack | Marketplace listings with category `mobility` |
| Professional cards | Unchanged: Business Profile + category |

**Non-goals:** Life Map, MapLibre, Territory Objects, Tenant Factory, Auth Foundation, Community Core schema, Business Profile schema.

**Invariant:** One commercial identity for trades (Business). Goods exchange is Marketplace. Neighbour/work asks are Help. No duplicated professional table.
