# ADR-012 Roles and Permissions Model

Version: 1.0
Status: Accepted
Document Type: Architecture Decision Record
Priority: Critical
Date: 2026-08-06

---

## Status

Accepted

---

## Context

Life Community OS needs authorization across:

- Tenant administration;
- Micro applications;
- Community features;
- Business profiles;
- Official entities.

ADR-011 establishes **Membership** as the community participation layer (Person ↔ Territory → Tenant). Membership type is classification only — not Authentication and not Authorization.

ADR-001 / Security Architecture already require:

- Identity / Authentication / Authorization owned by the Security Platform;
- Membership never grants actions by itself;
- Roles and Permissions remain Security Platform concerns, independent from Membership belonging types.

ADR-002 / ADR-003 require:

- every request executes inside one Tenant Context (fail closed);
- Tenant is the isolation / security boundary for Business Data;
- Territory is the community environment and organizational scope inside a Tenant;
- RLS enforces tenant isolation; RLS does not replace Authorization.

Open questions:

1. How are capabilities granted without treating Membership type as permission?
2. How do Tenant-wide admin roles coexist with microapp-specific roles?
3. How will Business Profile and Official Entity permissions attach later without collapsing into Membership?

This ADR defines the **Roles and Permissions Model**.

It does not create migrations or tables.

---

## Decision

**Authorization is separated from Membership.**

- **Membership** describes participation in a Tenant community (via Territory).
- **Roles and Permissions** describe capabilities (what actions are allowed).

### Authorization assignment model

```
Person
  → Membership
    → Role Assignment
      → Permissions
```

Reading the chain:

1. **Person** — which human;
2. **Membership** — participation context inside a Territory / Tenant community;
3. **Role Assignment** — which roles apply in that (or related) authorization scope;
4. **Permissions** — atomic capabilities granted through assigned roles.

Role Assignment is bound to an authorization evaluation scope that always includes the active **Tenant Context**. Membership provides community participation context; it does not equal a permission set.

### Core rules

1. **Membership is not authorization.**
2. **Role is not identity** (not Person, not User Account).
3. **Permission is the smallest capability unit.**
4. **Tenant remains the security boundary** for isolation and the primary AuthZ evaluation boundary for tenant Business Data.
5. **Territory remains organizational scope** (community environment), not a replacement Tenant isolation root.
6. Authentication Identity proves who is acting; Authorization decides allowed actions within Tenant Context and policies (ADR-001 / ADR-002).
7. Property Person Relationship roles (`owner`, `resident`, …) are domain associations — not Security Platform Roles unless explicitly bridged later by policy (ADR-008).

### Required support (capability scopes)

The model must support:

| Scope | Purpose |
|-------|---------|
| Tenant-level roles | Administration and cross-app tenant capabilities |
| Microapp-specific roles | Capabilities limited to one micro application |
| Future Business Profile permissions | Commercial representation management |
| Official Entity management permissions | Institutional representation management |

All scopes evaluate inside an explicit Tenant Context (or explicit Platform Context for platform ops). Ambiguous tenant scope fails closed.

---

## Domain Model

### Permission

Smallest capability unit.

Examples:

- `announcements.view`
- `bookings.create`
- `members.manage`
- `notices.manage`
- `profiles.approve`
- `tenant.configuration.manage`
- `roles.manage`
- `microapps.access_all`

Permissions are named capabilities, not people and not Membership types.

### Role

Named bundle of Permissions.

Examples:

- `community_admin`
- `tenant_owner`
- microapp roles (for example `bookings_manager`)

Role is not Person identity and not Membership.

### Role Assignment

Binding that attaches a Role to an actor context for evaluation.

Foundation intent:

- assignment is interpretable through **Person** (and thus authenticated Identity → Person link);
- typically considered alongside **Membership** / Tenant Context for community and tenant operations;
- may later target Business Profile or Official Entity management contexts without merging those entities into Membership.

Exact assignment subject shapes (Person-only vs Membership-scoped vs resource-scoped) are deferred to implementation ADRs/migrations, within these rules.

### Membership (unchanged role)

Participation only (ADR-011). May inform *which community* someone belongs to; does not grant Permissions by type alone.

### Micro applications

Feature surfaces that may define their own Roles/Permissions while still evaluating under Tenant Context and platform Authorization.

---

## Membership vs Roles vs Permissions

| Concept | Question | Grants actions? |
|---------|----------|-----------------|
| **Person** | Which human? | No |
| **User Account / Identity** | Who is authenticated? | No (AuthN only) |
| **Membership** | Community participation? | **No** |
| **Membership type** (`resident`, `staff`, …) | Participation classification? | **No** |
| **Role** | Which capability bundle? | Indirectly (via Permissions) |
| **Role Assignment** | Which Roles apply in this scope? | Indirectly |
| **Permission** | Is this atomic action allowed? | **Yes** (capability unit) |
| **Property Person Relationship** | Role on a Property unit? | No (domain association) |
| **RLS / Tenant Isolation** | Which data boundary applies? | No (isolation, not AuthZ) |

### Separation rules

1. Do not encode Permissions as Membership type strings.
2. Do not treat `community_admin` Membership type as a substitute for Role Assignment (if such a type exists, it is still not AuthZ).
3. Do not put Permissions on Person as identity attributes.
4. Do not use RLS policies as the sole Authorization engine for product actions.
5. Do not confuse SaaS Tenant with domain Membership type `tenant` (renter).

---

## Examples

### Example 1 — Resident

```
Person: Juan García
  └── Membership: Life Panoramica (type: resident)
        └── Role Assignment: (community member role or equivalent)
              └── Permissions:
                    - view announcements
                    - create bookings
```

Membership type `resident` describes participation.  
Permissions come from Role Assignment, not from the string `resident` alone.

### Example 2 — Community Administrator

```
Person: Elena
  └── Membership: Life Panoramica (participation)
        └── Role Assignment: community_admin
              └── Permissions:
                    - manage members
                    - manage notices
                    - approve profiles
```

### Example 3 — Tenant Owner

```
Person: Owner
  └── Membership / Tenant Context: Life Panoramica
        └── Role Assignment: tenant_owner
              └── Permissions:
                    - manage tenant configuration
                    - manage roles
                    - access all microapps
```

Tenant Owner capabilities are tenant-scoped. They do not bypass Platform Context rules for platform-wide operations and do not replace Service Role controls (ADR-003).

### Example 4 — Microapp-specific role

```
Role: bookings_manager (microapp: bookings)
  └── Permissions:
        - bookings.manage
        - bookings.configure
```

Assignable within Tenant Context; does not imply tenant_owner.

### Example 5 — Future Business Profile / Official Entity

```
Person → manages → Business Profile
  └── Role Assignment (business scope): business_profile_editor
        └── Permissions: business_profile.update

Person → represents → Official Entity
  └── Role Assignment (official scope): official_entity_admin
        └── Permissions: official_entity.manage
```

These remain Authorization scopes, not Membership types and not Person subtypes.

---

## Security Alignment

### Boundaries

| Concern | Owner |
|---------|-------|
| Identity / User Account | Security Platform |
| Authentication | Security Platform |
| Authorization (Roles / Permissions / Assignments) | Security Platform |
| Membership | Domain participation (ADR-011) |
| Tenant Isolation / RLS | Platform Security + Data (ADR-003) |
| Territory | Organizational / community environment scope |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context resolution (fail closed)
  → Authorization (Role Assignments → Permissions within Tenant Context + policies)
  → Domain operations (Membership informs participation; Property relationships inform unit association)
  → Database access (application scope + RLS)
```

### Alignment with RLS

- RLS answers: **which rows are in tenant scope?**
- Authorization answers: **is this action allowed for this actor in this Tenant Context?**
- Both are mandatory (defense in depth). Neither replaces the other.
- Territory may scope product UX and some resource selection; it does not replace Tenant as isolation root.

### Fail closed

- Missing Tenant Context → deny tenant Business Data operations.
- Missing Permission → deny action even if Membership exists.
- Membership without Role Assignment → no implied admin capabilities.

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Finalize permission naming taxonomy or Role catalogs;
- Implement RBAC/ABAC engines or policy DSL;
- Redefine Membership as Authorization;
- Define UI for role administration;
- Define invitation flows that auto-assign roles (product later);
- Collapse microapp roles into Membership types;
- Make Territory a separate SaaS isolation root;
- Define Service Role operational runbooks (ADR-003 already constrains bypass);
- Equate Property relationship types with Security Platform Roles.

---

## Rejected Alternatives

### Membership type = Permission

Rejected. Conflicts with ADR-001 / ADR-011 and prevents multi-capability evolution.

### Roles stored only as Person attributes

Rejected. Breaks Tenant-scoped evaluation and multi-membership actors.

### Authorization only via RLS

Rejected. RLS is isolation, not action Authorization (ADR-003).

### Global roles without Tenant Context for tenant Business Data

Rejected. Fail-closed Tenant Context remains mandatory (ADR-002).

### One flat role list with no microapp scope

Rejected as the only model. Tenant-level roles are required, but microapp-specific roles must also be supported.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-002 Tenant Isolation Model
- ADR-003 Database Security and RLS Model
- ADR-008 Property Person Relationship Model
- ADR-010 Person Identity Model
- ADR-011 Membership Community Participation Model
- Security: Authorization, Permissions, RBAC, Security Policies
- Product: Tenant administration, microapps, Business Profile, Official Entity

---

## Decision Rule

Until superseded, every authorization design must separate Membership (participation) from Roles/Permissions (capabilities), evaluate Permissions inside an explicit Tenant Context, keep Tenant as the security boundary and Territory as organizational scope, and never treat Membership type as a permission substitute.
