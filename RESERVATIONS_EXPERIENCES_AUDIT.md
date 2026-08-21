# Reservations + Experiences audit (Phase 8.1)

Scope: convert pack/demo Experiences and Reservations into a tenant-owned Resource → Availability → Reservation domain. Does not modify Life Map, Tenant Factory, Auth Foundation, Community Core schema, Business, or Housing.

## What exists

### Domain types (ADR-031 / ADR-027)

- `CommunityResource` / `Resource` in `packages/types/src/domain/resource.ts`: territorial inventory, access policy, slots, `Reservation` with `date` / `start` / `end`.
- `Experience` in `packages/types/src/domain/experience.ts`: already has optional `resourceId`. Product rule: Experience is not a second booking engine.

### Tenant pack (demo catalog)

- `tenants/life-panoramica/src/resources.ts`: padel, tennis, pool, rooms, BBQ. Occupied slots are a hardcoded `occupiedBaseline`. Comment in pack: booking workflows are not implemented in that slice.
- `tenants/life-panoramica/src/experiences.ts`: static cards with demo people (Marta, John, Lucía, …). Join is not a Reservation.
- Catalog bootstrap (`apps/web/src/lib/catalog/bootstrap-catalog.ts`) still seeds `experiences` and `resources` into durable catalog documents.

### UI (client store)

- `ReservationProvider`: **localStorage** + durable JSON (`lcos:resource-reservations`). No session `created_by`, no tenant RLS, no capacity engine.
- `ExperienceParticipationProvider`: **localStorage** join/save. Catalog or `getExperienceById` pack fallback.
- Screens (`ResourceDiscoveryScreen`, `ResourceDetailScreen`, `ResourceAvailabilityScreen`, `ReservationConfirmationScreen`, experience list/detail/join) read the catalog and pack `getResourceById` / `getExperienceById` when `homeMode === "premium"`.
- Resource detail still labels access with `demoMember.displayName` and `evaluateDemoResourceAccessForPerson`.
- Calendar / Profile mix pack formatters with the local reservation store.

### Database

- No `resources`, `resource_availability`, `reservations`, or `reservation_participants` tables.
- No `/api/resources` or `/api/reservations`.

## What is demo

| Surface | Demo behaviour |
| --- | --- |
| Resource catalog | Pack seed + catalog documents |
| Occupied slots | `occupiedBaseline` fake occupancy |
| Reservations | Browser localStorage, ids like `rv-${Date.now()}` |
| Experiences | Pack cards; join does not occupy a Resource |
| Create experience | `createExperience()` in pack session memory |
| Access copy | Marta / demo person area checks |
| Pack fallback | `getResourceById` / `getExperienceById` for premium home |

There is no runtime string “Reservar próximamente”; the equivalent is “booking not implemented” (disabled reserve, pack-only availability, join without persistence).

## What is missing

- Tenant-owned Resource records with `category` (sport / facility / hospitality / activity / service) and product statuses (draft / active / inactive / archived).
- Persisted `ResourceAvailability` (hours, slots, capacity, blocks).
- Persisted `Reservation` + `reservation_participants` with session ownership.
- Server AuthZ: member reserves public resources; staff creates administrative resources; cancel own vs cancel others.
- RLS isolation (Panorámica ≠ Valley; external DENIED).
- Experience as a Resource-backed activity that creates a Reservation (no GolfReservation / PoolReservation).
- Community notification on confirm; optional Community Event id on activity create (reuse Community Core, do not duplicate).

## What must migrate

1. Stop seeding `resources` and `experiences` in `bootstrapAllCatalogs` (same pattern as marketplace).
2. Replace `ReservationProvider` localStorage with `/api/reservations` + `/api/resources`.
3. Experience join → `POST /api/reservations` against the activity Resource (or its linked facility).
4. Create experience → `POST /api/resources` with `category: activity` (members); administrative facilities remain staff-only.
5. Keep ADR Resource / Experience types; extend them. Do not invent per-module reservation entities.

## Target graph

```
Resource (tenant scoped)
  → ResourceAvailability (slots / capacity / blocks)
  → Reservation (who / when / status)
      → ReservationParticipant
Experience (activity Resource, optional linked facility)
  → same Reservation table
```
