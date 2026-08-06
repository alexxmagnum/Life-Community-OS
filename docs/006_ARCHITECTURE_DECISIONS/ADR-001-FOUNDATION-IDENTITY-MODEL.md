# ADR-001 Foundation Identity Model

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

Life Community OS Foundation Phase requires a persistence-ready identity model for:

- Tenant
- Territory
- Person
- Membership

Domain documentation, Product Specification, Tenant Model, Data Model and Security documentation define these concepts, but leave critical relationships unresolved for implementation.

Open questions identified during Foundation Data Model extraction included:

1. Tenant ↔ Territory cardinality
2. Whether Person is tenant-owned, platform-owned, or independently related
3. Separation between authentication Identity and domain Person
4. Membership context and authorization boundaries

This ADR resolves only those foundation identity questions.

It does not define database schemas, migrations, UI, or authorization implementation details.

---

## Decisions

### Decision 1 — Tenant and Territory relationship

**Tenant** represents the SaaS customer / independent ecosystem.

**Territory** represents the geographical or functional environment where community life happens.

Initial relationship:

```
Tenant
  |
  +--- Territory (one or many)
```

A Tenant may operate one Territory or many Territories.

A Territory belongs to exactly one Tenant in the Foundation Phase.

#### Why this preserves SaaS scalability

- Commercial isolation, subscriptions, entitlements and configuration remain attached to Tenant.
- Community geography and local ecosystem scale independently through Territories.
- New Territories can be added under an existing Tenant without provisioning a new SaaS customer.
- Platform services remain shared while Business Data remains tenant-isolated.

#### Why Territory is not the same as Tenant

- Tenant answers: which independent customer ecosystem owns the data and commercial relationship?
- Territory answers: where does community life happen geographically or functionally?
- Tenant owns commercial state, configuration and isolation boundary.
- Territory owns local context for Places, Entities, Resources, Experiences and community participation.
- Product documentation already separates Territory (environment) from community participation and from SaaS tenancy.

#### Why future multi-territory tenants are supported

- One SaaS customer may manage multiple residential communities, campuses, resorts or destinations.
- The one-to-many model avoids forcing one Tenant per Territory, which would duplicate commercial identity and break white-label / multi-site operators.
- Foundation Phase may start with one Territory per Tenant operationally, without constraining the model to 1:1.

---

### Decision 2 — Person model

**Person** is the stable human identity in the Domain.

Person is **not**:

- User Account
- Membership
- Role
- Permission

Person can participate in multiple contexts through relationships (Memberships, Experiences, Entities, and other domain relationships).

**Do not place tenant ownership directly on Person.**

Person exists as a domain identity independent of a single Tenant column.

Participation in a Tenant ecosystem occurs through relationships that are tenant-scoped (for Foundation Phase: Membership → Territory → Tenant).

This preserves:

- one human across multiple Territories;
- future multi-tenant participation without remapping identity;
- separation between who the human is and where they belong.

---

### Decision 3 — Identity and Authentication separation

Authentication identity is separate from domain Person.

| Concept | Question answered |
|---------|-------------------|
| Identity (Security Platform) | Who is performing this action? |
| Person (Domain) | Which human is represented? |
| Membership (Domain) | Where and how does this person belong? |

Rules:

- Authentication verifies an Identity.
- An Identity may represent a Person.
- Person never becomes the authentication credential store.
- User Account / auth subject remains a Security Platform concern.
- Domain behaviour references Person, not raw authentication identifiers, except at explicit identity-link boundaries.

---

### Decision 4 — Membership model

**Membership** represents belonging only.

Initial model:

```
Person
  |
Membership
  |
Territory
```

Rules:

- Every Membership belongs to exactly one Person.
- Every Membership belongs to exactly one Territory.
- Territory belongs to a Tenant; therefore Membership is tenant-scoped through Territory.
- Membership type is configurable (not hardcoded schema enums as product law).
- Membership has a lifecycle (begin, change, end).
- Membership is not authorization.
- Membership is not a Role.
- Membership is not a Permission.
- Membership never owns Person.
- Membership never replaces Identity.

---

### Decision 5 — Authorization boundary

| Concern | Owner |
|---------|-------|
| Identity | Security Platform |
| Authentication | Security Platform |
| Authorization | Security Platform |
| Membership | Domain belonging only |

Membership must never grant actions by itself.

Authorization evaluates whether an authenticated Identity may perform an action, within Tenant Context and Security Policies.

Roles and Permissions remain Security Platform concerns, independent from Membership belonging types.

---

## Data Model Consequences

Foundation persistence must respect:

1. `Tenant` is the isolation and commercial root.
2. `Territory` references `Tenant` (many Territories per Tenant allowed).
3. `Person` has no direct `tenant_id` ownership column.
4. `Membership` references `Person` and `Territory`.
5. Tenant-scoped access to a Person for a given Tenant is derived through Membership → Territory → Tenant.
6. Authentication identity tables remain outside Domain Person tables, linked explicitly when needed.
7. Membership type is stored as configurable classification, not as authorization role.

These consequences constrain the first Foundation migrations.

They do not define column lists beyond the relationships decided here.

---

## Security Consequences

1. Every request continues to execute inside one Tenant Context.
2. Tenant isolation remains mandatory for Territory and Membership data.
3. Person records are not globally readable across tenants by default; access is mediated by Membership and Authorization.
4. Cross-tenant Person participation, if ever allowed, must be explicit and governed — not implicit through shared Person rows without authorization.
5. RLS or equivalent enforcement must protect Tenant-owned Territory/Membership data; Person access policy must follow relationship-derived tenant visibility, not a direct Person.tenant_id.
6. Authorization never uses Membership type as a permission substitute.

---

## Future Evolution

Allowed without reversing this ADR:

- Multiple Territories under one Tenant
- Additional Membership contexts beyond Territory (for example Entity-scoped membership) via later ADRs
- Verified, temporary, seasonal, invitation-based Membership models as configuration
- Explicit Person ↔ Identity linking strategies
- Federated or cross-tenant participation with explicit contracts
- Privacy-sensitive secondary identities linked to Person

Not allowed without a superseding ADR:

- Collapsing Tenant and Territory into one concept
- Making Person a child row of Tenant by direct ownership
- Using Membership as Authorization
- Embedding authentication credentials inside Person

---

## Rejected Alternatives

### 1:1 Tenant = Territory

Rejected because it prevents multi-site SaaS customers and conflates commercial isolation with geographical community context.

### Person owned directly by Tenant (`person.tenant_id`)

Rejected because Product Specification requires Person independence from Territory/Membership and Identity stability across contexts. Direct tenant ownership blocks multi-territory participation under one human identity.

### Membership as authorization

Rejected because Product Specification and Security documentation separate belonging from permissions, roles and authorization.

### Person = Authentication Identity

Rejected because Security Identity answers who is acting; Person answers which human is represented. Authentication remains replaceable infrastructure; Person remains Domain.

### Territory without Tenant

Rejected for Foundation Phase because SaaS isolation, entitlements and commercial ownership require a Tenant root. Territory alone cannot provide commercial isolation.

---

## Related Domains

- Product Specification: Territory, Person, Membership
- Business Platform: Tenant Model
- Platform Architecture: Tenant Architecture, Tenant Identity
- Data Model: Multitenancy, Identifiers, Entities
- Security: Identity, Authentication, Authorization, RBAC, Permissions
- Foundations Glossary: Territory, Person, Membership
- Roadmap: Foundation Phase

---

## Decision Rule

Until superseded by a later ADR, all Foundation Phase implementation of Tenant, Territory, Person and Membership must comply with this document.
