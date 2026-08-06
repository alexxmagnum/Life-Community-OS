# ADR-033 Community Identity Profiles and Presence Model

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

Community requires **contextual profiles** so members can present themselves inside a Tenant community without replacing the global **Person** identity.

ADR-010 establishes Person as independent human identity — not User Account, Business Profile, or Official Entity.

ADR-011 establishes Membership as community belonging (Person ↔ Territory → Tenant).

ADR-029 allows Groups/Circles as organizational layers inside a Tenant.

ADR-032 uses Person-authored recommendations; authors need accountable, privacy-aware community presentation.

Open questions:

1. How does a Community Profile relate to Person and Membership?
2. What visibility and privacy controls apply inside a Tenant?
3. How do interests, preferences and participation presence work without becoming a general social network?

This ADR defines the **Community Identity Profiles and Presence Model**.

It does not create migrations or tables.

---

## Decision

**Community Profile is a contextual participation layer linked to Person through Membership.**

It is the community-facing representation of a Person **inside a Tenant community context** — not a second global identity root.

### Core rules

1. **Person remains global identity** (ADR-010).
2. **Membership defines community belonging** (ADR-011).
3. **Community Profile defines contextual representation** (display, interests, local presence preferences).
4. **RBAC controls capabilities** (edit profile, view restricted fields, moderate profiles).
5. **Tenant remains the security boundary.**
6. Community Profile is not a User Account, Business Profile, Official Entity, or Group.
7. One Person may have different Community Profile presentations across Tenants via distinct Memberships — without duplicating Person.

```
Person (global human identity)
  └── Membership (Tenant community belonging via Territory)
        └── Community Profile (contextual representation / presence)
              └── optional Group-facing facets
```

---

## Person vs Community Profile

| Concept | Scope | Answers |
|---------|-------|---------|
| **Person** | Global domain identity | Which human is this? |
| **User Account / Identity** | Security Platform | How do they authenticate? |
| **Membership** | Tenant community via Territory | Do they belong here? |
| **Community Profile** | Contextual inside that Membership/Tenant | How do they appear and participate here? |
| **Business Profile** | Commercial representation | How is a business listed? (ADR-016) |
| **Official Entity Profile** | Institutional representation | How is an institution listed? |

### Separation rules

1. Community Profile **never replaces** Person as the durable human key.
2. Deleting/hiding a Community Profile does not delete Person.
3. Ending Membership should deactivate or hide the Community Profile in that Tenant (fail closed for community presence).
4. Login credentials never live on Community Profile.
5. Becoming recommendable/followable in Community uses Person + Profile visibility — not a new identity table that bypasses Person.

---

## Visibility Model

Community Profile fields and presence surfaces use visibility classes inside the Tenant:

| Visibility | Typical meaning |
|------------|-----------------|
| `members` | Eligible Tenant/Territory Members |
| `area` | Members associated with a Community Area facet |
| `group` | Members of selected Groups (ADR-029) |
| `connections` | Narrower audience if product defines follows/saves relationships (ADR-028) — still Tenant-scoped |
| `private` | Only the Person (+ authorized admins) |

### Visibility rules

1. Visibility is audience policy inside Tenant — not a new isolation root.
2. Default should minimize oversharing (privacy by default for sensitive fields).
3. Official/admin views of restricted fields require RBAC.
4. Cross-tenant profile browsing is out of default scope.
5. Directory Business/Official visibility remains ADR-016/017 — distinct from Community Profile.

---

## Privacy

Privacy controls what Community Profile data is stored, shown and used for discovery/presence.

### Privacy rules

1. Contact details on Community Profile (if any) are optional and visibility-gated — distinct from Authentication email on User Account.
2. Recommendations, comments and mentions must respect target profile visibility (ADR-028 / ADR-032).
3. Search indexing of Community Profiles must honor visibility and minimization (ADR-022).
4. Export/deletion requests follow platform privacy governance; Membership/Profile cleanup must not break Audit immutability requirements (ADR-021) for historical events.
5. Presence indicators must be opt-in or clearly configurable where product shows “online/active.”
6. Privacy settings are not Permissions and cannot grant admin capabilities.

---

## Interests and Preferences

Community Profile may hold participation-oriented attributes:

| Category | Examples |
|----------|----------|
| **Interests** | Sports, culture, volunteering, gardening |
| **Preferences** | Language, notification digest for community, calendar default Area filters |
| **Skills / offerings** (non-commercial) | “Can help with translations” — not a Business Profile substitute |
| **Accessibility preferences** | Display/participation preferences |

### Rules

1. Interests may power discovery, Group suggestions and recommendations ranking — Tenant-scoped only.
2. Commercial service offerings belong on **Business Profile**, not Community Profile (ADR-016).
3. Preferences may integrate with Core Notifications preferences (ADR-019) without duplicating channel stacks.
4. Interests are not RBAC Roles and not Membership types.

---

## Participation Presence

Participation presence expresses how a Member is currently engaging in community life surfaces.

| Presence facet | Meaning |
|----------------|---------|
| **Profile completeness** | Whether contextual profile is set up |
| **Activity presence** | Recent eligible Community activity (feed-safe) |
| **Availability / status** (optional) | Soft status like “open to chat about clubs” — not AuthN session authority |
| **Live presence** (optional) | Online/last-seen if enabled — privacy-gated |

### Presence rules

1. Presence is contextual to Tenant Community — not a global social graph status.
2. Presence must not leak into other Tenants.
3. Presence is not Authentication proof and not Authorization.
4. Moderators may hide abusive presence text via RBAC; they do not become Identity providers.
5. Experience/Event attendance remains on those systems of record (ADR-027); presence may reflect it only under visibility rules.

---

## Group Integration

| Integration | Behaviour |
|-------------|-----------|
| Default Community Profile | Tenant/Territory participation face |
| Group-facing facet | Optional nickname/bio visible primarily in a Group |
| Group Membership | Does not create a new Person or replace Tenant Membership |

### Rules

1. Group nicknames are presentation overlays — Person id remains canonical.
2. Private Group visibility cannot expose private profile fields beyond Group policy.
3. Leaving a Group removes Group-facing facets; Tenant Community Profile may remain while Membership is active.
4. Group admin cannot change global Person identity fields — only permitted community/group presentation fields.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary for Community Profiles |
| Person | Global identity root |
| Membership | Belonging prerequisite for community profile presence |
| Community Profile | Contextual representation — not security boundary |
| RBAC | Edit/view-moderate profile capabilities |
| Visibility / Privacy | Constrain disclosure inside Tenant |
| Business/Official profiles | Separate commercial/institutional representations |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Membership in community?
  → Authorization (view/edit profile fields)
  → Visibility / privacy filters
  → Return Community Profile / presence
```

### Alignment statements

- Community Profile APIs must not return other Tenants’ profiles.
- Creating a Community Profile never creates a Tenant or Subscription.
- Recommendations authorship remains Person-linked even when displayed via Community Profile (ADR-032).
- Disabled Community profile features must not expose write APIs (ADR-023).

---

## Examples

### Example 1 — Same Person, two communities

```
Person: Juan García
  ├── Membership + Community Profile @ Life Panoramica
  └── Membership + Community Profile @ Another Tenant
Same human; contextual presentations differ; one Person id
```

### Example 2 — Privacy-minimized resident

```
Community Profile visible to members:
  display name + interests
Phone number: private
Admins with Permission may view restricted contact if policy allows
```

### Example 3 — Interests drive discovery

```
Interests: running, gardening
Suggestions: Running Circle Group, gardening experiences
Not a Business Profile for paid coaching
```

### Example 4 — Group facet

```
Tenant Community Profile: "Maria"
Gardening Circle facet nickname: "Maria G."
Person id unchanged
```

### Example 5 — Anti-patterns avoided

```
Community Profile ≠ login account
Community Profile ≠ plumber business listing
Community Profile ≠ new SaaS Tenant
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Replace Person, Membership, or Authentication Identity;
- Merge Community Profile with Business/Official profiles;
- Build a global public people search engine across Tenants;
- Define full GDPR runbooks or field-level encryption schemes;
- Implement realtime presence protocols in detail;
- Make interests into Permissions or Membership types;
- Allow Community Profile to own Property relationships.

---

## Rejected Alternatives

### Community Profile as global identity replacing Person

Rejected (ADR-010). Person remains the human identity.

### One profile row shared across all Tenants without Membership context

Rejected. Breaks contextual privacy and Tenant isolation expectations.

### Membership type stores all profile presentation fields as AuthZ

Rejected. Presentation ≠ Authorization (ADR-012).

### Community Profile as Business Profile

Rejected (ADR-016). Commercial listings stay separate.

### Cross-tenant social profile graph

Rejected (ADR-028). Not a general social network.

---

## Related Domains

- ADR-010 Person Identity Model
- ADR-011 Membership Community Participation Model
- ADR-029 Community Groups and Circles Model
- ADR-032 Community Recommendations and Local Discovery Model
- ADR-028 Community Participation and Social Interaction Model
- ADR-025 Community Microapp Domain Model
- ADR-016 Official Entities and Business Profiles Model
- ADR-012 Roles and Permissions Model
- ADR-019 Notifications and Communication Model
- ADR-022 Search and Discovery Platform Model
- ADR-023 Configuration and Feature Management Model

---

## Decision Rule

Until superseded, community-facing member representation must use Community Profile as a contextual layer linked to Person through Membership: Person stays global identity, Membership stays belonging, Profile stays tenant-scoped presentation/presence/interests under visibility and privacy rules, RBAC stays capability control, and Tenant stays the security boundary — never replacing Person or creating a cross-tenant social identity system.
