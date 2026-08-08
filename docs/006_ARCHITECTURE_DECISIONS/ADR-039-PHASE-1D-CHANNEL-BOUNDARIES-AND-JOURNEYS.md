# ADR-039 Phase 1D Channel Boundaries and User Journeys

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: Critical
Date: 2026-08-08

---

## Status

Accepted

---

## Context

Phase 1 Community Communication Foundation has established:

- Channel (ADR-035)
- Resource access scoping (ADR-036)
- Residency-derived access (ADR-037)
- Residency verification (ADR-038)
- Experience as participatory happening (ADR-027)
- Groups (ADR-029)
- Types and Panoramica demo contracts

Before persistence, Phase 1D closes remaining domain gaps: complete user journeys, finalized Channel boundaries (anti-WhatsApp), and confirmation that no parallel activity aggregate is introduced.

This ADR does **not** create migrations, UI, or implementation.

---

## Decision

1. Document normative **user journeys** for residency, resources, channels, and experiences.  
2. Finalize **Channel IS / IS NOT** and relationships to Group, Experience, LocalEntity, and Territory Authority.  
3. Confirm **Experience is the only activity write-model aggregate**.  
4. Introduce **no new major aggregates** in Phase 1D.

Permission matrix: ADR-040. Completion checklist: roadmap doc `16_PHASE_1_COMMUNITY_COMMUNICATION_COMPLETION.md`.

---

## 1. Complete user journeys

### 1.1 New resident onboarding

```
Person creates account (Identity / User Account — ADR-010 path)
        │
        ▼
Selects Territory (community environment)
        │
        ▼
Obtains Tenant Membership (participation — ADR-011)
        │
        ▼
Selects Property / Address (ADR-006 / ADR-007)
        │
        ▼
Creates PropertyPersonRelationship (role claim)
  status = pending_verification
        │
        ▼
ResidencyVerification case (ADR-038)
  evidence via Core Files — never on Person
        │
        ▼
Approved → relationship status = active (verified)
        │
        ▼
Derived CommunityArea ids (ADR-037)
        │
        ▼
Access to Channels / Resources per policy (ADR-035 / ADR-036)
```

**Relationship roles supported in the claim** (ADR-008 / ADR-037):

| Role | Typical meaning |
|------|-----------------|
| `owner` | Ownership interest |
| `resident` | Lives at / occupies |
| `tenant` | Rents / leases (domain renter — not SaaS Tenant) |
| `family_member` | Household family association |
| `guest` | Temporary association |
| `staff` | Operational staff association |

**Normative rules:**

1. Claim **never** grants restricted access (ADR-038).  
2. Only **active verified** relationships contribute Community Area eligibility.  
3. Membership is required for community participation; residency is separate.  
4. Guest/staff eligibility for area-scoped reserves is Tenant policy (default fail-closed unless listed in eligibility roles).

---

### 1.2 Resource access journey

**Example — Resident of Aldea Golf → Padel Court Aldea Golf**

```
Discover resource (catalog / Home / Channel)
        │
        ▼
Visibility check (ADR-036 accessPolicy.visibility)
  e.g. territory → public info visible to Territory members
        │
        ▼
Reservation scope check (accessPolicy.reservationScope)
  e.g. community_area → only listed Community Area ids
        │
        ▼
Active verified residency in required area? (ADR-037 / ADR-038)
        │
        ▼
RBAC reserve capability?
        │
        ▼
Availability / conflict check (ADR-031 — future booking engine)
        │
        ▼
Allowed / Denied
```

| Scenario | View public info | Reserve |
|----------|------------------|---------|
| Same area, active verified residency | Yes (typical `visibility: territory`) | Yes if scope matches + RBAC |
| Different Community Area, verified elsewhere | Yes (public visibility) | **No** for area-scoped resource |
| Pending verification claim | Yes (public visibility) | **No** |
| Shared territorial resource (`reservationScope: territory`) | Yes | Yes if Membership + RBAC |

**Phase 1D note:** Availability evaluation is specified as a step; full booking workflow is **out of Phase 1 persistence scope** until explicitly approved.

---

### 1.3 Channel access journey

| Channel kind | Who may view / participate |
|--------------|----------------------------|
| **Public / open community** | Territory Members with `channel.view` (feature on) |
| **Private area channel** (`requiresVerifiedResidency` + `communityAreaId`) | Active verified residency in that Community Area |
| **Official channel** | View: Territory Members (typical); **Publish:** Territory Authority / Official Entity governance + RBAC (`publish_official` / channel publish) |
| **Interest / marketplace / mobility / business / service** | Per type + ownerKind; not free-form chat |

```
Open Channel
  → If requiresVerifiedResidency:
       require active verified residency in communityAreaId
  → Else:
       Territory Membership + channel capabilities
  → Publish official content:
       Official Entity / Territory Authority + RBAC
```

---

### 1.4 Experience journey (activity)

**Experience is the only activity aggregate** (ADR-027). UI may label it “Activity” via i18n.

Examples (all Experiences):

- padel match  
- golf meetup  
- dinner  
- community event  

```
Create Experience
  → optional channelId (organization)
  → optional groupId (hosting group)
  → optional communityAreaId
  → optional resourceId (eligibility must pass before bookable bind)
  → publish (RBAC)
  → others Join / waitlist / attend (participation)
```

**Forbidden:** `Activity`, `SportActivity`, `EventActivity` as domain entities or tables.

---

## 2. Final Channel boundaries

### Channel IS

- Communication **organization** layer  
- Discovery entry point for structured Content and Experiences  
- Permission-aware community space (visibility + residency gates)  
- Typed: official, community, interest, business, service, marketplace, mobility  

### Channel IS NOT

- Replacement for **Group** (membership community)  
- Replacement for **Experience** (the happening)  
- Replacement for **LocalEntity** / Business Profile  
- Replacement for **Resource** (physical inventory)  
- A **WhatsApp clone** or primary chat room product  

### Relationships

| From | To | Relationship |
|------|-----|--------------|
| Channel | Group | Group may **sponsor** an interest Channel (`ownerKind: group`). Group membership ≠ Channel chat membership. |
| Channel | Experience | Experience may be published **in** a Channel (`channelId`). Channel does not own the Experience lifecycle. |
| Channel | LocalEntity | Business/service Channels may be owned/linked by Business Profile / LocalEntity representation. |
| Channel | Territory Authority | Official Channels owned by Official Entity Profile (product alias: Territory Authority). |
| Channel | Community Content | Content published into Channel (ADR-026). |
| Channel | Resource | **No ownership.** Experiences may reference Resources separately. |

### Anti-WhatsApp clone (normative)

1. Primary verbs: Publish, Join, Verify, Reserve-eligibility — not “message the group”.  
2. Discussions are content-centric (ADR-028), attached to items — not infinite free chat as the unit of organization.  
3. No `ChatRoom` aggregate in Phase 1.  
4. Structured Experience fields (when, where, capacity, participants) replace ephemeral “anyone playing?” messages.

---

## 3. Experience validation (formal)

| Statement | Verdict |
|-----------|---------|
| Canonical write model for happenings | **Experience** |
| Product word “Activity” | i18n label only |
| `CommunityActivity` (pulse) | Read-model / projection — not a parallel write aggregate |
| Experience types | `experience` \| `event` \| `meeting` |
| New Activity / SportActivity / EventActivity entities | **Rejected** |

**GOOD**

```
Experience: "Padel Friday 19:00"
  channelId → interest Channel
  groupId → Padel group
  communityAreaId → Aldea Golf (optional)
  resourceId → Padel Court (optional, eligibility-gated)
```

**BAD**

```
Activity { ... }
SportActivity { ... }
EventActivity { ... }
```

---

## Consequences

### Positive

- Journeys are implementable without inventing aggregates  
- Channel cannot drift into chat-clone scope  
- Persistence can target known entities only  

### Follow-ups (not this ADR)

- Migrations / RLS  
- Production AuthZ  
- Booking engine  

---

## References

- ADR-027, ADR-028, ADR-029, ADR-031  
- ADR-035, ADR-036, ADR-037, ADR-038  
- ADR-040 Phase 1D Permission Matrix  
- `docs/018_ROADMAP/16_PHASE_1_COMMUNITY_COMMUNICATION_COMPLETION.md`
