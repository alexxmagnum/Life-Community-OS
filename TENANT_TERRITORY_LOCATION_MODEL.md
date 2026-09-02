# TENANT · TERRITORY · LOCATION MODEL

**Phase:** 18P-FIX-A  
**Status:** Architecture invariant (permanent)  
**Scope:** Definitions, relations, valid cases — not a product redesign

---

## Core invariant

```
Tenant ≠ Territory ≠ Location
```

These are three distinct concepts. They must never be collapsed into one another.

| Concept | Meaning | Examples |
|---------|---------|----------|
| **Tenant** | SaaS customer / primary organization | LIFE Panorámica, Ayuntamiento X, Urbanización Y, Resort Z |
| **Territory** | Optional organizational division inside a Tenant | Aldea Golf, Hacienda, Valle Golf, Barrio Norte |
| **Location** | Real physical place | street, home, restaurant, facility, building, common space |

---

## Relations

```
Tenant 1 ──N Territory   (Territory optional; zero allowed)
Territory 0 ──N Location (Location may also hang from Tenant only)
```

**Location always belongs to a Tenant.**  
**Location may omit Territory.**

### Valid cases

**Case 1 — Tenant with territories**

```
LIFE Panorámica (Tenant)
  └── Aldea Golf (Territory)
        └── Piscina Aldea Golf (Location)
```

**Case 2 — Tenant without territories**

```
Pueblo X (Tenant)
  └── Plaza Mayor (Location)   ← no Territory
```

**Case 3 — Mixed: zones + independent places**

```
LIFE Panorámica (Tenant)
  ├── Aldea Golf (Territory)
  │     └── Club house (Location)
  └── Calle independiente (Location)   ← Territory NULL
```

---

## Domain rules

| Domain | Territory | Notes |
|--------|-----------|-------|
| Location | **Optional** | Map citizen; tenant isolation always |
| Business | Optional | Often inherits from linked Location |
| Help | Optional | Neighbour help; may be territory-scoped |
| Reservation / Resource | Optional | Stamp when actor has Territory |
| Announcement / Community posts | Optional in store; projections may require | Official communication |
| Experience | **Required** (product law) | Community life occurs in a Territory context today |
| Membership | **Required territoryId today** | Join binds Person → Territory (+ denormalized Tenant). Tenant-only membership is a future alignment, not this phase |
| Channel | Required | Conversation scope |

**Experiences requiring Territory does not mean Locations require Territory.**

---

## Membership (current vs progressive)

**Current persistence law (unchanged this phase):**

```
Account → Membership(person, tenantId, territoryId required)
```

**Progressive product story (documented target):**

```
Account
  → Tenant belonging
  → (optional) Territory / zone belonging
```

UI must not say “elige comunidad” when the user is choosing a **zone inside a Tenant**. Prefer:

| Situation | Copy |
|-----------|------|
| Invitation to a zone | “Únete a Aldea Golf en LIFE Panorámica” |
| General tenant entry | “Explora LIFE Panorámica” |
| Tenant without zones | “Únete a la comunidad” |
| Access code | “Código de acceso” (zona o código general) |

---

## Permissions (scopes)

| Scope | Meaning |
|-------|---------|
| **Tenant** | Isolation + SaaS ownership; admin can operate whole org |
| **Territory** | Optional geographic/org filter; territory admin = zone only (role still via Membership) |
| **Location** | Place-level ops (e.g. facility manager) — capability overlays, not a new Tenant |

Admin dashboards today aggregate primarily at **Tenant** grain; Territory filters apply where Active Territory is set.

---

## Map

- Life Map projects **Locations**, not Territories-as-points.
- A Location **without** Territory remains map-visible under Tenant scope (and under any Territory filter via legacy unscoped visibility).
- Territory bounds are optional framing; they do not replace Location SoT.

---

## Analytics

Metrics may aggregate by:

1. Tenant (required)
2. Territory (when stamped)
3. Location (when activity is place-bound)

Never assume every row has a Territory. Unscoped rows roll up to Tenant only.

Pilot activity metrics (`community_activation_metrics`) are Tenant-scoped today; Territory/Location rollups are additive.

---

## Invariants (checklist)

1. Tenant identity ≠ Territory identity ≠ Location identity  
2. Territory always references a Tenant  
3. Location always references a Tenant  
4. Location.territoryId is optional  
5. Tenant may have zero Territories  
6. Do not invent Territory from Tenant slug when creating Locations  
7. Experience/Membership Territory requirements are product laws — not Location laws  
8. Account ≠ Membership  
9. Location ≠ Community  
10. No SubTenant / ZoneTenant / CommunityEntity as Tenant substitute  

---

## Corrections applied in 18P-FIX-A

| Issue | Fix |
|-------|-----|
| Location writes always stamped default Territory from Tenant | `resolveOptionalTerritoryId` — stamp only explicit/inherited |
| Life Map dropped Locations without Territory | `projectLocationToLifeMapView` allows optional Territory |
| TenantFactory rejected zero Territories | Provision allows empty territories list |
| Join copy “Código de comunidad” | “Código de acceso” + zone hint |

**Not changed:** Membership schema, authorization model, Tenant schema, Experience requiring Territory.

---

## Related sources

- `packages/types/src/domain/tenant.ts`
- `packages/types/src/domain/territory.ts`
- `packages/types/src/domain/location.ts`
- `packages/types/src/domain/territory-ownership.ts`
- `packages/types/src/domain/membership.ts`
- `apps/web/src/lib/tenant/resolve-territory.ts`
- `supabase/migrations/20260830120000_territory_core_contract.sql`
- `docs/003_PRODUCT_SPECIFICATION/01_TERRITORY.md`

---

## FIN
