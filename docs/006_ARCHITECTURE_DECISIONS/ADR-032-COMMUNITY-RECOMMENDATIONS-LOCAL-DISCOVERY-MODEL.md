# ADR-032 Community Recommendations and Local Discovery Model

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: High
Date: 2026-08-06

---

## Status

Accepted

---

## Context

Communities need **local discovery enriched by member experience** — not only catalog search of businesses and official entities.

ADR-017 defines **Service Directory** as a reusable discovery layer over Business and Official Entity Profiles (categories, search, coverage, verification) that does **not** replace booking, payments or commerce.

ADR-016 separates Person from Business/Official profiles and uses verification for trust.

ADR-025 / ADR-028 provide Community participation and structured interactions (reactions, comments, follows, activity) inside Tenant/Territory — not a general social network.

Open questions:

1. How do member recommendations relate to Service Directory without duplicating it?
2. Which signals and recommendation types are in scope?
3. How is trust handled so recommendations do not become fake reviews or unauthorized commerce?

This ADR defines the **Community Recommendations and Local Discovery Model**.

It does not create migrations or tables.

---

## Decision

**Community Recommendations is a social discovery capability that complements Service Directory.**

It surfaces **member experience and community signals** to help people discover local services, places, experiences and useful community resources — still under Tenant isolation.

### Core rules

1. **Person remains identity.**
2. **Membership enables participation** in recommending / reacting (default eligibility).
3. **RBAC controls capabilities** (create recommendation, moderate, feature, configure).
4. **Tenant remains the security boundary.**
5. **Territory/Area define scope** for discovery audience and locality.
6. **Recommendations do not create commercial transactions** (no checkout, payments, or order creation in this capability).
7. Recommendations complement — and may deep-link to — Service Directory profiles; they do not replace Directory indexing, verification, or coverage models (ADR-017).
8. Not a general social network or cross-tenant review marketplace (ADR-028).

```
Service Directory (catalog / verification / coverage)
        ▲ complements
Community Recommendations (member signals / social discovery)
        ↑ Person + Membership + RBAC
        ↑ Territory / Area scope
```

---

## Service Directory Relationship

| Layer | Responsibility |
|-------|----------------|
| **Service Directory** | Authoritative profile discovery: Business/Official profiles, categories, filters, location vs coverage, verification status |
| **Community Recommendations** | Member-authored tips, endorsements, “used and recommend”, local picks, experience-linked suggestions |

### Relationship rules

1. A recommendation **may reference** a Business Profile, Official Entity Profile, Community Experience/Event, Resource, or free-text local tip.
2. When a Business/Official profile is referenced, Directory remains source of truth for verification badge, coverage and profile media.
3. Recommendations must not invent parallel business identity records (no second “vendor user” table).
4. Directory search and Recommendations feeds may appear together in UX; backends remain separate capabilities with shared Core identity/security.
5. Unverified profiles may be recommendable only under Tenant policy; trust UI must not imply official verification from a recommendation alone.

---

## Recommendation Types

| Type | Meaning |
|------|---------|
| **Endorsement** | Member recommends a known Business/Official profile |
| **Local tip** | Short advice about a place/service/experience without formal commerce |
| **Experience pick** | Recommendation tied to a Community Experience/Event (ADR-027) |
| **Neighbor suggestion** | Soft suggestion for amenities/resources/groups |
| **Collection / list** | Curated set of picks by a Member or Group (if enabled) |
| **Official highlight** | Authorized official/community-admin featured pick (RBAC) — still not a Directory verification substitute |

Types are configurable classification — not Permissions.

---

## Community Signals

Signals that may enrich ranking and trust presentation (within Tenant):

| Signal | Source examples |
|--------|-----------------|
| Explicit recommendation | Created recommendation content |
| Reactions / comments | ADR-028 interactions on the recommendation |
| Follow / save | Members follow a pick or save for later |
| Participation proximity | Same Area/Group Membership (organizational, not security) |
| Recency / freshness | Newer picks weighted per policy |
| Organizer/official boost | RBAC-authorized highlights |
| Negative reports | ADR-028 reporting → moderation |

### Signal rules

1. Signals are Tenant-scoped; no cross-tenant signal graphs by default.
2. Reactions are not formal votes/governance (ADR-028).
3. Signal weight policies are Configuration — not custom code per Tenant.
4. Search Core may index recommendation documents with visibility filters (ADR-022).
5. Storage/analytics of signals must not leak other Tenants’ Behaviour.

---

## Trust Model

| Trust source | Role |
|--------------|------|
| **Directory verification** | Profile trust (`verified`, etc.) — ADR-016 / ADR-017 |
| **Recommendation authorship** | Known Person + Membership in community |
| **Moderation** | RBAC hides spam/abuse; reports handled in Community |
| **Official highlight** | Authorized featured status — labeled distinctly from verification |
| **Transparency** | Show author community context allowed by privacy policy — not fake anonymity that breaks accountability |

### Trust rules

1. A recommendation **never** sets Business Profile status to `verified`.
2. Recommendations **do not create commercial transactions** or imply platform escrow.
3. Paid stealth advertising disguised as member recommendations requires explicit product/compliance controls (default: forbidden without disclosure capability).
4. Suspended/archived profiles should not appear as trusted recommendable targets in default discovery.
5. Moderation/reporting does not replace Service Directory claim/review workflows.

---

## Geographic Scope

| Scope | Effect |
|-------|--------|
| **Territory** | Default community discovery boundary |
| **Area** | Local facet (e.g. tips relevant to Aldea Golf) |
| **Coverage awareness** | When linking Business Profiles, Directory coverage may inform “serves this Area” — Recommendations do not redefine coverage |

### Rules

1. Recommendations inherit Tenant isolation; Territory is the isolation path for community-scoped picks.
2. Area is organizational discovery scope — not a security boundary.
3. External providers with in-Territory coverage remain Directory concerns; Recommendations may still endorse them for Members.
4. Cross-tenant recommendation marketplaces are out of default scope.

---

## Business Integration

| Integration | Behaviour |
|-------------|-----------|
| Business Profile | Recommend / deep-link to Directory profile |
| Official Entity Profile | Recommend institutional services carefully; official highlights Permission-gated |
| Services microapp | Directory remains catalog; Recommendations add social layer |
| Marketplace / Bookings | Optional deep-links only if entitled — Recommendations do not checkout |

### Rules

1. Business owners do not gain RBAC powers from being recommended.
2. Profile managers may be notified of new recommendations via Core Notifications (ADR-019) under preference/policy.
3. Recommendation media (photos of a visit) use Core Files (ADR-020); they do not replace profile galleries as system of record.
4. Group-curated lists (ADR-029) are allowed as organizational collections inside Tenant.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary |
| Person | Author identity |
| Membership | Participation eligibility |
| RBAC | Create, feature, moderate recommendations |
| Territory / Area | Discovery scope |
| Directory verification | Independent trust channel |
| Transactions | **Not created** by this capability |
| Social graph | Not a general social network |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community recommendations feature enabled?
  → Authorization (create/moderate)
  → Membership eligibility
  → Geographic / visibility scope
  → Publish recommendation + signals
  → Optional Directory deep-link resolution
  → Notifications / Search / Audit as applicable
```

### Alignment statements

- Recommendation feeds must not mix Tenants.
- Mentions/follows on recommendations follow ADR-028 visibility rules.
- Disabled capability must not expose write APIs (ADR-023).
- “Recommended” UI never impersonates `verified` Directory status.

---

## Examples

### Example 1 — Member endorses locksmith

```
Person (Member) creates endorsement → Business Profile "Alex Locksmith"
Directory shows verification + coverage
Recommendation appears in Area/Territory feed
No payment started
```

### Example 2 — Local tip without profile

```
Tip: "Best Saturday fruit truck near Detinsa gate"
Scope: Area
Signals: reactions / saves
May later link to a Business Profile when claimed/verified
```

### Example 3 — Experience pick

```
Member recommends Community yoga experience
Deep-link to Experience (ADR-027)
Calendar/registration remain Experience systems of record
```

### Example 4 — Official highlight vs verification

```
Community admin Permission: recommendations.feature
Highlights recycling point Official Entity
Badge: "Community highlight" ≠ Directory "verified" (though entity may also be verified)
```

### Example 5 — Complement, don’t duplicate

```
User searches "pharmacy" → Service Directory results
Also sees "Neighbors recommend" rail from Community Recommendations
Same Tenant; two capabilities
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Replace Service Directory (ADR-017);
- Create bookings, payments, carts, or escrow;
- Build Yelp/Google-scale public web review SEO product;
- Implement ML ranking model details;
- Make recommendations a formal governance vote;
- Allow cross-tenant review graphs by default;
- Let recommendations mutate Official/Business verification status;
- Replace Incidents or formal complaints (ADR-018).

---

## Rejected Alternatives

### Recommendations replace Service Directory

Rejected. Directory owns catalog/verification/coverage.

### Recommendations as checkout entry that bypasses Bookings/Marketplace

Rejected. No commercial transactions in this capability.

### Anonymous cross-tenant review network

Rejected. Conflicts with Tenant isolation and accountability.

### Business Profile absorbs Person recommendations as identity

Rejected (ADR-010 / ADR-016).

### Reaction count grants verification

Rejected. Verification remains controlled (ADR-016).

### Membership type grants feature-all / moderate-all recommendations

Rejected (ADR-012).

---

## Related Domains

- ADR-017 Service Directory Discovery Model
- ADR-016 Official Entities and Business Profiles Model
- ADR-025 Community Microapp Domain Model
- ADR-028 Community Participation and Social Interaction Model
- ADR-027 Community Experiences and Events Model
- ADR-029 Community Groups and Circles Model
- ADR-022 Search and Discovery Platform Model
- ADR-019 Notifications and Communication Model
- ADR-012 Roles and Permissions Model
- ADR-011 Membership Community Participation Model
- Future: Bookings / Marketplace microapps

---

## Decision Rule

Until superseded, member-enriched local discovery must be implemented as Community Recommendations that complement Service Directory: Person-authored, Membership-eligible, RBAC-governed, Tenant-scoped, Territory/Area-aware social signals that never create commercial transactions or replace profile verification — and never operate as a general or cross-tenant social review network.
