# ADR-029 Community Groups and Circles Model

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

Communities contain smaller interest, activity and organizational groups inside a Tenant’s Territory environment.

ADR-025 defines Community as a reusable microapp for communication and participation.

ADR-028 provides structured interactions (comments, follows, feeds, moderation) that are content-centric and not a general social network.

ADR-011 establishes **Tenant Membership** as community belonging (Person ↔ Territory → Tenant).

ADR-012 requires capabilities via RBAC — Membership type is not Authorization.

ADR-005 establishes Community Area as geographic organization, not a security boundary. Groups address **social/organizational** clustering that Areas do not cover (clubs, committees, interest circles).

Open questions:

1. How do Groups/Circles relate to Tenant Membership and Community Areas?
2. What group types, membership and roles exist without creating new tenancy?
3. How do visibility and content integration work under Tenant isolation?

This ADR defines the **Community Groups and Circles Model**.

It does not create migrations or tables.

---

## Decision

**Community Groups are an internal organizational layer inside a Tenant.**

Groups are **not Tenants** and **do not create independent security boundaries**.

“Circles” are a product-facing name for certain group shapes; architecturally they are Community Groups.

### Core rules

1. **Person remains identity** (ADR-010).
2. **Tenant Membership defines community belonging** (ADR-011).
3. **Group Membership defines participation inside groups** (subset affiliation).
4. **RBAC controls capabilities** (create group, moderate group, post in group, etc.).
5. **Tenant remains the security boundary.**
6. Groups inherit Tenant Context via Territory (and optional Area association).
7. Group Membership never replaces Tenant Membership, Authentication, or Authorization.

```
Tenant (security boundary)
  └── Territory
        ├── Community Area (geographic organization, optional)
        └── Community Group / Circle (social/organizational layer)
              └── Group Membership → Person
```

---

## Group Types

| Type | Typical purpose |
|------|-----------------|
| **Interest circle** | Hobbies, sports, culture, wellbeing topics |
| **Activity group** | Ongoing activity cohorts tied to experiences/events |
| **Committee / working group** | Operational or governance sub-teams |
| **Committee of owners / residents** (product label) | Local organizational committees — still not a Tenant |
| **Official program group** | Groups sponsored by Official Entity / community admin |
| **Custom** | Tenant-configured classifications |

### Type rules

1. Group type is classification metadata — not a Permission and not a Tenant.
2. Types may be enabled per Tenant configuration (ADR-023).
3. Groups may optionally link to a Community Area for local organization; Area link is not required and is not isolation.
4. Business Profiles are not Groups; professionals remain ADR-016 profiles (may be invited/linked later without merging concepts).

---

## Group Membership

| Concept | Meaning |
|---------|---------|
| **Tenant Membership** | Person belongs to the Tenant community via Territory |
| **Group Membership** | Person participates in a specific Group inside that Tenant |

### Group Membership rules

1. Default prerequisite: active Tenant Membership in the relevant Territory/Tenant context (unless an explicit Tenant policy allows limited exceptions — still Tenant-scoped).
2. A Person may join many Groups; a Group may have many Persons.
3. Group Membership has lifecycle (e.g. invited → active → left → removed) — exact statuses deferred to implementation.
4. Leaving a Group does not end Tenant Membership.
5. Ending Tenant Membership should revoke or suspend Group Memberships in that Tenant (fail closed for participation).
6. Group Membership is **not** Authentication and **not** RBAC Permission.

---

## Group Roles

Group-local roles describe responsibility **inside a Group** (organizer, moderator, member).

| Group role (examples) | Meaning |
|----------------------|---------|
| `member` | Standard participant |
| `moderator` | Moderates group interactions/content per Permissions |
| `organizer` / `admin` | Manages group settings, memberships, publishing in group |

### Role rules

1. Effective capabilities still evaluate through **Security Platform RBAC** (ADR-012), possibly using group-scoped Role Assignments or Permissions that take group context as a resource scope.
2. Group role labels must not silently become Tenant-wide admin powers.
3. “Group admin” ≠ `tenant_owner`.
4. Organizer Permissions for Experiences/Events (ADR-027) may be granted to group organizers for group-hosted activities without granting Community-wide publish-official rights.

---

## Visibility

| Visibility | Meaning |
|------------|---------|
| `public_in_territory` | Discoverable to eligible Tenant/Territory Members |
| `area_scoped` | Discoverable primarily within a linked Community Area audience |
| `private` | Visible to Group Members (and authorized admins) only |
| `hidden` / `unlisted` | Join by invite/link; limited discovery |

### Visibility rules

1. Visibility is audience policy inside the Tenant — not a new isolation root.
2. Private group content must not appear in broad Community discovery/search for non-members (ADR-022 alignment).
3. Mentions/follows/notifications for group content still respect visibility (ADR-028 / ADR-019).
4. Territory remains on the isolation path even for private groups.
5. Visibility changes are Permission-gated and auditable when security-relevant.

---

## Content Integration

Groups integrate with Community capabilities as an optional **audience/organization context**:

| Integration | Behaviour |
|-------------|-----------|
| Announcements / news | May target a Group audience (in addition to Territory/Area scope rules) |
| Discussions / proposals | May live primarily inside a Group |
| Experiences / events / meetings | May be hosted by / associated with a Group (ADR-027) |
| Interactions | Comments/reactions/reporting apply inside group-visible content (ADR-028) |
| Calendar | May filter by Group membership |

### Integration rules

1. Content retains Territory isolation path; Group is an additional organizational audience facet.
2. Publishing still follows ADR-026 (RBAC + optional moderation lifecycle).
3. Group feed is a filtered Community/Activity surface — not a separate social network product.
4. Files attached to group content use Core Files (ADR-020).
5. Incidents remain Incidents microapp; a Group may be observers/assignees contextually without owning service-desk tenancy.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security / isolation boundary |
| Community Group | Organizational layer only — **not** a security boundary |
| Community Area | Geographic organization — distinct from Groups |
| Person | Identity |
| Tenant Membership | Community belonging prerequisite (default) |
| Group Membership | In-group participation |
| RBAC | Group management and in-group capabilities |
| Notifications / Audit | Platform Core |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Community / groups feature enabled?
  → Tenant Membership eligibility (default)
  → Authorization (RBAC for group action)
  → Group Membership / visibility checks
  → Domain operation + Notifications/Audit/Search as applicable
```

### Alignment statements

- Creating a Group never creates a Tenant, Subscription, or RLS root.
- Group-scoped Permissions still evaluate inside Tenant Context.
- Cross-tenant groups are out of default behaviour.
- Disabled Groups feature must not expose group APIs/content (ADR-023).

---

## Examples

### Example 1 — Interest circle

```
Tenant: Life Panoramica
Group: Running Circle (interest)
Visibility: public_in_territory
Members join via Membership eligibility
Posts/discussions visible per visibility + Permissions
```

### Example 2 — Area-linked committee

```
Group: Aldea Golf Pool Committee
Linked Area: Aldea Golf
Visibility: area_scoped / private
Organizers manage meetings via RBAC
```

### Example 3 — Group-hosted experience

```
Activity group hosts Experience
Registration limited to Group Members (policy)
Reminders via Core Notifications
```

### Example 4 — Separation of concerns

```
Person: Maria
  ├── Tenant Membership: Life Panoramica (resident)
  ├── Group Membership: Gardening Circle
  └── RBAC: no community_admin
Maria can participate in circle; cannot publish official Territory announcements
```

### Example 5 — Anti-pattern avoided

```
"Create a Group" does NOT provision a new SaaS Tenant
"Group admin" does NOT bypass Tenant isolation or become billing customer
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Make Groups into Tenants, billing customers, or RLS roots;
- Replace Community Areas with Groups (geography vs social organization);
- Replace Tenant Membership with Group Membership;
- Define enterprise org-chart HR systems;
- Build federation of groups across Tenants by default;
- Equate Group roles with Security Platform Roles without RBAC assignment;
- Finalize join-request UX or invite token formats.

---

## Rejected Alternatives

### Group as Tenant / sub-tenant security boundary

Rejected. Breaks SaaS isolation model and ADR-002/003.

### Group Membership replaces Tenant Membership

Rejected (ADR-011). Community belonging remains Membership → Territory → Tenant.

### Groups = Community Areas

Rejected. Areas are geographic; Groups are social/organizational.

### Group admin implies tenant_owner

Rejected (ADR-012).

### General social-network “spaces” without Tenant scope

Rejected (ADR-028). Groups stay inside Tenant community surfaces.

---

## Related Domains

- ADR-025 Community Microapp Domain Model
- ADR-028 Community Participation and Social Interaction Model
- ADR-027 Community Experiences and Events Model
- ADR-026 Community Content Publishing Model
- ADR-011 Membership Community Participation Model
- ADR-012 Roles and Permissions Model
- ADR-005 Community Area Model
- ADR-013 Community Microapp Governance Model
- ADR-019 Notifications and Communication Model
- ADR-021 Audit and Activity Tracking Model
- ADR-023 Configuration and Feature Management Model
- ADR-024 Billing and Plans Model

---

## Decision Rule

Until superseded, smaller interest/activity/organizational clusters must be modeled as Community Groups (circles) inside a Tenant: Person identity, Tenant Membership for community belonging, Group Membership for in-group participation, RBAC for capabilities, Territory/Area for geographic facets, and Tenant as the only security boundary — never as independent tenancy or a general social network.
