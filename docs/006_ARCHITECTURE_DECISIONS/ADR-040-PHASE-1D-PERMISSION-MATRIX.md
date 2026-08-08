# ADR-040 Phase 1D Permission Matrix

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

Phase 1D requires a final permission matrix covering residency relationship roles, community administration, Territory Authority, Official Entity, and Business Entity — without inventing a parallel AuthZ system.

Authorization remains **Platform RBAC** (ADR-012 / ADR-034).  
Residency roles are **classification** on PropertyPersonRelationship (ADR-008 / ADR-037).  
Area-scoped access is **derived** from active verified residency (ADR-037 / ADR-038).  
Resource visibility vs reservation is **policy** (ADR-036).

This ADR does **not** create migrations or implement AuthZ.

---

## Decision

Publish the Phase 1D permission matrix below as the normative product/AuthZ design input for persistence and UI.

### Evaluation order (mandatory)

```
1. Tenant isolation
2. Territory Membership (participation)
3. RBAC capabilities (Permission)
4. Resource / Channel access policy
5. Active verified residency (Community Area derivation)
6. Ownership / stewardship (Authority, Official Entity, Business Profile)
7. Availability (resources — booking engine later)
```

**Claim (`pending_verification`) never passes step 5 for restricted surfaces.**

---

## Actors

| Actor | Meaning |
|-------|---------|
| `owner` | PropertyPersonRelationship type — ownership interest |
| `resident` | Lives at / occupies Property |
| `tenant` | Domain renter (not SaaS Tenant) |
| `family_member` | Household family association |
| `guest` | Temporary Property association |
| `staff` | Staff association to Property / operations |
| `community_admin` | RBAC governance role package (ADR-034) |
| `territory_authority` | Official Entity Profile acting as Territory Authority (product alias) |
| `official_entity` | Verified institutional profile operators (ADR-016) |
| `business_entity` | Business Profile managers (ADR-016) |

Residency actors assume: active Territory Membership + relationship status as noted.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| Y | Allowed when Membership active, feature enabled, and RBAC grants the capability |
| N | Not allowed |
| V | Requires **active verified** residency in the relevant Community Area (in addition to Y/R) |
| R | Explicit RBAC capability required |
| A | Authority / Official stewardship path (RBAC on Official Entity assignment) |
| B | Business Profile management path for own entity/channel |
| P | Tenant policy may allow; **default fail-closed** for private/restricted |

---

## Matrix

| Action | owner | resident | tenant | family_member | guest | staff | community_admin | territory_authority | official_entity | business_entity |
|--------|-------|----------|--------|---------------|-------|-------|-----------------|---------------------|-----------------|-----------------|
| View public Territory / resource information | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Access private area Channels | V | V | V | V | P/V | P/V | A | A | A | N* |
| Create Groups | Y+R | Y+R | Y+R | Y+R | P | P | Y+R | Y+R | Y+R | P |
| Create Experiences | Y+R | Y+R | Y+R | Y+R | P | P | Y+R | Y+R | Y+R | P |
| Create Channels | N | N | N | N | N | N | R | A+R | A+R | B (own business/service type) |
| Publish official information | N | N | N | N | N | N | R | A+R | A+R | N |
| Manage territorial Resources | N | N | N | N | N | N | R | A+R | A+R | N |
| Reserve shared territorial Resources | Y+R | Y+R | Y+R | Y+R | P | P | Y+R | Y+R | Y+R | P |
| Reserve area-scoped Resources | V+R | V+R | V+R | V+R | P/V | P/V | A override | A override | A override | N |
| Verify residents (review claims) | invite path | N | N | N | N | N | R | A+R | A+R | N |
| Claim own residency | Y | Y | Y | Y | Y | Y | Y | N typical | N typical | N typical |

\* Business Entity does not unlock private **residential** area Channels by default; may access own business Channel only (B).

---

## Capability mapping (demo / future RBAC)

| Action family | Capability keys (illustrative — tenant stub) |
|---------------|-----------------------------------------------|
| Channel view | `community.channel.view` |
| Channel create | `community.channel.create` |
| Channel publish | `community.channel.publish` |
| Official publish | `community.announcement.publish_official` |
| Experience | `community.experience.view\|create\|join\|manage` |
| Resource view / reserve / manage | `community.resource.view\|reserve\|manage` |
| Create territorial resource | `community.resource.create_territorial` |
| Residency claim | `community.residency.claim` |
| Residency verify review | `community.residency.verify_review` |
| Group create | `community.group.create` |

---

## Scope rules

1. **Territory scope:** Membership is Territory-scoped through Tenant isolation.  
2. **Community Area scope:** Private Channels and area-scoped reserves use derived area ids from verified residencies — never hardcoded on Person.  
3. **Ownership:** Territorial Resources owned by Authority / Official Entity / Area stewardship / Business Profile — never by resident Person as owner of the court/pool.  
4. **Verification status:** `pending_verification` and `rejected` do not unlock V cells.  
5. **Owner invitation:** Property `owner` may participate in verification method `owner_invitation` without becoming Territory Authority.

---

## Consequences

### Positive

- Single matrix for persistence policies and UI gates  
- Clear separation: residency role ≠ Permission  
- Supports demo validation already wired (Marta / John / Lucia)

### Negative / follow-ups

- Production Role Assignments must encode community_admin / authority packages  
- Guest/staff policy tables deferred to Tenant configuration  

---

## References

- ADR-012, ADR-016, ADR-034  
- ADR-035–ADR-039  
- `tenants/life-panoramica/src/capabilities.ts` (stub only)
