# ADR-035 Community Channels Model

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: High
Date: 2026-08-08

---

## Status

Accepted

---

## Context

Communities today fragment communication across many unstructured chat groups. Life Community OS must organize information without becoming a WhatsApp clone or a social network wall.

ADR-025 defines Community as a reusable microapp (announcements, news, discussions, experiences, and related features).

ADR-026 defines content publishing. ADR-027 defines Experiences (product language may say “Activity”). ADR-029 defines Groups. ADR-005 defines Community Area (product language may say “Micro Area”). ADR-016 defines Official Entity and Business Profiles. ADR-031 defines Resources and Reservations.

Open questions:

1. What organizes *where* structured information is published without duplicating Group, Experience, Resource, or LocalEntity?
2. How do official, community, interest, business, service, marketplace, and mobility spaces share one model?
3. How do Channel boundaries stay compatible with Tenant isolation and existing RBAC?

This ADR defines the **Community Channels Model**.

It does **not** create migrations or tables. Type contracts may land before persistence. Channel boundaries must be validated in domain logic before any persistence layer is introduced.

---

## Decision

**Channel is the only new aggregation in Phase 1 Community Communication Foundation.**

A Channel is an **organization layer** for structured community communication inside a Tenant’s Territory.

Channel is **not**:

- a Tenant or security boundary;
- a chat room or messaging product;
- a replacement for Group, Experience, Resource, LocalEntity, or Community Content;
- a parallel authorization system.

```
Tenant (security boundary)
  └── Territory
        ├── Community Area (optional organization — ADR-005)
        ├── Channel (organization layer — this ADR)
        │     ├── Community Content (ADR-026)
        │     └── Experience (ADR-027; UI may label as Activity)
        ├── Community Group (ADR-029; may sponsor an interest Channel)
        ├── Community Resource (ADR-031; not owned by Channels)
        └── LocalEntity / profiles (ADR-016 / ADR-017 / ADR-032)
```

### Core rules

1. **Tenant remains the security boundary** (ADR-002 / ADR-003).
2. **Person remains identity** (ADR-010). Membership remains participation (ADR-011).
3. **RBAC remains authorization** (ADR-012 / ADR-034) — Channel membership or type is never a Permission.
4. Publishing “somewhere” means publishing into a **Channel** (content and/or experiences), not into an unstructured chat.
5. Channel does not own territorial Resources. Resources remain ADR-031 inventory with Authority / Area / Entity ownership.
6. Product UI copy is localized (i18n). Code, schemas, and this ADR use English identifiers.

---

## Channel Types

| Type | Typical purpose | Typical owner |
|------|-----------------|---------------|
| **official** | Administration, municipality, public services communication | Official Entity Profile (Territory Authority product alias) |
| **community** | Neighbours, general community, area-scoped neighbour spaces | Platform / Official Entity / configured steward |
| **interest** | Sports, hobbies, recurring interest topics | Community Group (sponsor) or configured steward |
| **business** | Local businesses (e.g. restaurants) | Business Profile |
| **service** | Professionals / local services | Business Profile |
| **marketplace** | Buy / sell organization surface | Platform / Territory configuration |
| **mobility** | Car sharing and mobility offers organization surface | Platform / Territory configuration |

### Type rules

1. Type is classification metadata — not a Permission and not a Tenant.
2. Types may be enabled per Tenant via Feature Management (ADR-023).
3. Marketplace and mobility are **Channel types** (organization), not closed vertical modules.
4. Official channels require an Official Entity Profile owner (`ownerKind = official_entity`).

---

## Ownership

| `ownerKind` | Meaning |
|-------------|---------|
| `official_entity` | Official Entity Profile (Territory Authority in product language) |
| `group` | Community Group sponsors the channel (typical for interest) |
| `business_profile` | Business Profile owns business/service channel |
| `platform` | Tenant-configured platform-managed channel (e.g. default marketplace) |

### Ownership rules

1. Owner references are domain identifiers within the same Tenant / Territory context.
2. Residents (Persons) do not “own” official channels by virtue of Membership.
3. Group sponsorship does not make the Group a Tenant or security boundary (ADR-029).
4. Changing ownership is a privileged, auditable action when security-relevant (ADR-021).

---

## Relationships

| Related concept | Relationship |
|-----------------|--------------|
| Community Content | Content may be published **in** a Channel |
| Experience | Experience may be published **in** a Channel; may also link Group / Area / Resource |
| Community Group | May **sponsor** an interest Channel; Groups still own membership separately |
| Community Area | Optional organizational scope on a Channel — not isolation |
| Official Entity | Owns official channels; product alias **Territory Authority** |
| LocalEntity / Business Profile | May own or link business/service channels |
| Resource | **Not** owned by Channel; Experiences may *use* a Resource (ADR-031) |

---

## Boundary validation (required before persistence)

Before any Channel row is persisted, domain validation must enforce:

1. `tenantId` and `territoryId` are present and consistent with Tenant Context.
2. `type` is a known `ChannelType`.
3. `ownerKind` / `ownerId` are present and compatible with `type` (e.g. `official` ⇒ `official_entity`).
4. Optional `communityAreaId`, when set, belongs to the same Territory (validated when Area context is available).
5. Channel is never treated as an AuthZ root, Membership root, or Tenant.
6. Status is one of `draft` | `active` | `archived`.

TypeScript contracts expose pure validators for these rules so UI and future services share one boundary definition.

---

## Lifecycle

```
draft → active → archived
```

1. Draft channels are not broadly discoverable.
2. Archiving preserves history references; it does not delete Audit (ADR-021).
3. Lifecycle is not a Permission.

---

## Explicitly out of scope

- Chat / real-time messaging as the primary Channel purpose
- Parallel Community-only ACL engines
- Closed modules (PadelModule, GolfModule, …)
- Full booking / payments engines (Resource remains ADR-031; foundation links only)
- Database migrations (follow-up engineering task after type contract review)

---

## Consequences

### Positive

- One organization layer for “where do I publish / look?”
- Aligns WhatsApp-chaos replacement with structured Content + Experience
- Reuses Territory, Area, Group, Experience, Resource, LocalEntity, RBAC

### Negative / follow-ups

- Requires careful UI so Channel is not mistaken for chat
- Persistence and RLS deferred until contracts are reviewed
- Feature flags / demo catalogs deferred to a later Phase 1 slice

---

## Compliance

Until superseded:

1. Channel is the only new Phase 1 communication aggregation.
2. Experience remains the Activity aggregate (ADR-027).
3. Community Area remains the Micro Area aggregate (ADR-005).
4. No Channel persistence ships without boundary validators and Tenant RLS design.
5. No parallel architecture around Channel.

---

## References

- ADR-002 Tenant Isolation Model
- ADR-003 Database Security RLS Model
- ADR-005 Community Area Model
- ADR-012 Roles Permissions Model
- ADR-016 Official Entities and Business Profiles Model
- ADR-023 Configuration and Feature Management Model
- ADR-025 Community Microapp Domain Model
- ADR-026 Community Content Publishing Model
- ADR-027 Community Experiences and Events Model
- ADR-029 Community Groups and Circles Model
- ADR-031 Community Resources and Reservations Model
- ADR-034 Community Governance and Administration Model
