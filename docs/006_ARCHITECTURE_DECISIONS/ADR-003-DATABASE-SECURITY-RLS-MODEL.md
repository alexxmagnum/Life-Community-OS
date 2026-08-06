# ADR-003 Database Security and RLS Model

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

Life Community OS is a native multi-tenant SaaS platform.

ADR-001 defines the Foundation Identity Model:

- Tenant is the isolation and commercial root;
- Territory belongs to exactly one Tenant;
- Person has no direct `tenant_id`;
- Membership belongs to Person and Territory and is never authorization;
- Authentication Identity is separate from domain Person.

ADR-002 defines Tenant Isolation:

- every request/job executes inside one explicit Tenant Context;
- unresolved Tenant Context fails closed;
- defense in depth requires application scoping and database enforcement;
- RLS is a required follow-up, not optional hardening.

Existing Data Model documentation (Multitenancy, Data Security) requires that Business Data never be shared by default and that every Business Entity exists inside one Tenant Context unless explicitly defined as Platform Data.

Existing Security Architecture documentation requires Identity, Authentication, Authorization and Security Policies to remain Security Platform concerns, separate from Domain belonging.

Foundation identity tables exist. Application Tenant Context contracts exist. Database RLS policies, migrations for RLS and runtime session binding are not yet implemented.

This ADR defines the Database Security and RLS Model for Foundation Phase.

It does not create migrations, implement RLS policies or application code.

---

## Decisions

### 1. Database security model

Database security for tenant-owned and territory-linked Business Data is mandatory.

PostgreSQL Row Level Security (RLS), or an equivalent database enforcement mechanism with equal strength, is the Foundation database enforcement layer.

Application filtering and Tenant Context propagation remain mandatory.

**Database security is not replaced by application logic.**

**Application Tenant Context is not replaced by database policies.**

Both layers are required (defense in depth).

### 2. Tenant-owned data

#### What is directly tenant-scoped

| Entity / table class | Ownership key | Isolation rule |
|----------------------|---------------|----------------|
| `tenants` | row `id` is the Tenant | Visible/operable only for the active Tenant Context (plus governed platform admin paths) |
| `territories` | `tenant_id` | `tenant_id` must equal active Tenant Context |
| `memberships` | via `territory_id` → `territories.tenant_id` | Readable/writable only when resolved Tenant matches active Tenant Context |
| Future tenant resources with `tenant_id` | `tenant_id` | Must match active Tenant Context |
| Future territory-linked resources | `territory_id` → Tenant | Must resolve to active Tenant Context |

#### Ownership rules

1. **Tenant** owns commercial isolation, configuration and the root boundary for Business Data.
2. **Territory** is tenant-owned. All Territory rows carry `tenant_id`.
3. **Membership** is territory-owned and therefore tenant-scoped through Territory. Membership never grants permissions.
4. **Future tenant Business Data** must declare either:
   - direct `tenant_id`, or
   - a mandatory path to Tenant through Territory (or another ADR-approved tenant-owned parent).
5. Rows without a resolvable Tenant path are not valid Business Data for Foundation tenant operations.
6. Platform Data (Countries, Currencies, Languages, Timezones, System Configuration, Feature Catalog, Platform Roles, and similar) is not tenant-owned and uses explicit Platform Context — never “no context”.

#### Identities (Security Platform)

`identities` are **not** tenant-owned Business Data.

- Identity answers: who is acting?
- Identity links to Person when required; it does not carry `tenant_id`.
- Membership never grants Identity access.
- Database access to Identity rows is a Security Platform concern, constrained by Authentication/Authorization and Person linkage rules — not by Membership belonging.
- Tenant Context may constrain *which Person-linked operations* an Identity may perform, but Identity rows themselves are not filtered as tenant Business Data.

### 3. Relationship-derived data — Person

Person is **not** tenant-owned directly.

Person has no `tenant_id` column (ADR-001).

Tenant-scoped visibility of Person is relationship-derived:

```
Person
  |
Membership
  |
Territory
  |
Tenant
```

#### Access rules for Person

1. A Person row is visible inside a Tenant only when at least one valid Membership links that Person to a Territory owned by the active Tenant Context (unless a later ADR defines an explicit governed grant).
2. RLS on `persons` must not use a direct `persons.tenant_id` predicate.
3. Person policies must evaluate relationship-derived tenant visibility (Membership → Territory → Tenant).
4. Absence of a linking Membership in the active Tenant fails closed for tenant-scoped Person reads/writes.
5. Cross-tenant Person participation, if ever allowed, requires an explicit governed contract — never implicit global Person readability.

### 4. RLS strategy (defense in depth)

#### Mandatory layers

1. **Application-level enforcement (mandatory)**  
   Resolve Tenant Context; scope every tenant-owned query/command; fail closed when unresolved.

2. **Database-level enforcement (mandatory)**  
   Enable RLS (or equivalent) on tenant-owned and relationship-derived tables so unscoped or mistaken queries cannot cross tenants.

#### Why both

- Application-only filtering fails when privileged clients, bugs or ad-hoc queries bypass filters.
- Database-only filtering fails to provide Authorization, Automation and AI with an explicit Tenant Context independent of SQL.
- Security Principles and Data Security require durable ownership protection; Multitenancy requires isolation that cannot be accidentally disabled in application code alone.

#### Foundation RLS coverage (direction)

Enable and policy-protect at minimum:

- `tenants` (self-scoped access control)
- `territories`
- `memberships`
- `persons` (relationship-derived only)
- later domain tables with `tenant_id` or Territory linkage

`identities` remain under Security Platform access rules; they are not Membership-gated tenant Business Data.

Exact policy SQL is out of scope for this ADR and belongs to a later migration task.

### 5. Tenant Context propagation into the database

#### Decision

Foundation uses a **trusted backend binding** of resolved Tenant Context into **database session variables** (PostgreSQL settings / equivalent request-scoped DB locals) that RLS policies read.

JWT claims (or equivalent auth assertions) may carry identity and optionally assist application-layer Tenant resolution, but **JWT claims alone are not the database policy source of truth**.

#### Expected mechanism (not implemented by this ADR)

```
Request / Job
  ↓
Authenticate Identity (Security Platform)
  ↓
Resolve Tenant Context (ADR-002; fail closed)
  ↓
Authorize action within Tenant Context
  ↓
Trusted backend opens DB session / transaction
  ↓
Bind Tenant Context to database session variables
  (e.g. app.tenant_id, optional app.territory_id, correlation id)
  ↓
Execute queries under RLS policies that read those variables
  ↓
Discard binding at end of execution unit
```

#### Rules

1. **Request context** owns resolution and Authorization. The database never invents Tenant Context.
2. **Database session variables** are the primary input RLS policies use for tenant predicates.
3. **JWT claims** prove Identity (and may include claims used by the application resolver). They must be translated by trusted backend code into session bindings; clients must not be able to set session tenant variables directly.
4. Binding is per execution unit and must be re-validated; residual session state must not silently reuse a previous Tenant Context.
5. Optional Territory scope may be bound when the operation is territory-scoped; missing required territory scope fails closed at application layer before query execution.
6. Platform Context operations that touch Platform Data use an explicit platform binding mode — not an empty tenant variable interpreted as “all tenants”.

#### Alternatives allowed later without superseding this ADR

- Equivalent claim-to-session bridges (for example custom GUC helpers, transaction-local config functions).
- Stronger session binding of Tenant Context into auth tokens **in addition to** database session variables.

Requires a superseding ADR:

- Relying solely on client-supplied JWT `tenant_id` for RLS without trusted backend binding.
- Omitting database session binding permanently in favor of application filters only.

### 6. Service Role boundaries

#### What Service Role is

A privileged database credential (for example Supabase service role) that can bypass RLS.

#### When bypass is allowed

Service Role may bypass RLS only when **all** of the following hold:

1. The operation runs in **backend-only** trusted infrastructure (never in browsers, mobile apps, public clients or untrusted edge code that exposes the key).
2. The operation is an explicitly authorized **platform procedure** (provisioning, controlled admin tooling, migration/ops, audited automation runner).
3. An explicit target **Tenant Context** (or explicit Platform Context) is declared and logged for the execution unit — even when RLS is bypassed.
4. Application-level scoping still applies to tenant Business Data unless the procedure is a documented platform-wide maintenance task that iterates tenants one explicit context at a time.
5. Access is auditable (who/what, Tenant Context, reason, time).

#### Forbidden

- Embedding or exposing Service Role credentials in client applications, PWA bundles, mobile apps or public repositories.
- Using Service Role as the default path for ordinary user requests.
- Using Service Role to silently read/write across tenants without per-tenant context iteration and audit.
- Treating Service Role as a substitute for Authorization or Tenant Context resolution.

### 7. Security boundaries (must remain separated)

| Concern | Owner | Responsibility | Does not do |
|---------|-------|----------------|-------------|
| Identity | Security Platform | Who is acting? | Define Tenant or grant Membership |
| Authentication | Security Platform | Prove Identity | Authorize actions or isolate tenants |
| Authorization | Security Platform | What action is allowed within Tenant Context and policies? | Define Domain belonging |
| Tenant Isolation | Platform Security + Data enforcement (app + RLS) | Which data boundary applies? | Replace Authorization |
| Membership | Domain | Where/how does this Person belong? | Grant roles, permissions or actions |

Evaluation order remains:

```
Identity
  ↓
Authentication
  ↓
Tenant Context resolution (fail closed)
  ↓
Authorization (within Tenant Context + Security Policies)
  ↓
Domain operations (Membership informs belonging only)
  ↓
Database access (application scope + RLS)
```

RLS enforces Tenant Isolation at persistence. RLS does not replace Authorization. Membership never becomes a permission.

---

## Data Access Rules

### Direct tenant predicates

For tables with `tenant_id` (including `territories` and future tenant resources):

```
row.tenant_id = current_setting('…tenant…')  -- conceptual; exact GUC name deferred to implementation
```

Active Tenant Context must be bound before access. Missing binding fails closed.

### Territory-linked predicates

For `memberships` and future territory-owned rows:

```
row.territory_id → territories.tenant_id = active Tenant Context
```

### Person (relationship-derived)

```
persons.id IN (
  Membership.person_id
    WHERE Membership.territory_id → territories.tenant_id = active Tenant Context
)
```

Conceptual only; implementation may use security definer helpers or equivalent policy SQL consistent with this rule.

### Tenants table

A Tenant row is accessible when `tenants.id` equals the active Tenant Context, except governed platform admin procedures under Service Role boundaries.

### Identities

Access is Security Platform governed (authenticated subject, Person link, Authorization). Not Membership-granted. Not treated as tenant Business Data with `tenant_id` RLS.

### Platform Data

Accessible under explicit Platform Context. Never interpreted as unrestricted cross-tenant Business Data access.

### Fail-closed defaults

| Condition | Result |
|-----------|--------|
| No Tenant Context for tenant-owned operation | Deny |
| Session tenant variable unbound / empty | Deny |
| Row tenant ≠ active Tenant Context | Deny |
| Person without Membership path into active Tenant | Deny |
| Ambiguous multi-tenant Membership without explicit selection | Deny (ADR-002) |

---

## Security Consequences

1. RLS migrations become a required Foundation implementation task constrained by this ADR.
2. Backend database adapters must bind Tenant Context to session variables before tenant-owned queries on non-Service-Role paths.
3. Client-facing credentials must use roles subject to RLS; Service Role remains backend-only.
4. Person and Identity access paths diverge: Person is relationship-derived; Identity is Security Platform data.
5. Authorization bugs cannot be fully compensated by RLS, and RLS misconfiguration cannot be fully compensated by application filters — both must be tested.
6. Observability should record Tenant Context, policy denials and Service Role usage on security-relevant events.
7. AI and Automation remain bound to Tenant Context (ADR-002); database policies reinforce that boundary for persistence.

---

## Future Evolution

Allowed without superseding this ADR:

- Implementing RLS policy SQL and migrations consistent with these rules
- Naming and helper functions for session GUCs / claim bridges
- Extending the same pattern to future tenant-owned and territory-linked domain tables
- Relationship-derived policies for additional Person-linked entities
- Stronger JWT ↔ session binding and short-lived request credentials
- Auditing and break-glass platform admin procedures under Service Role rules

Requires a superseding ADR:

- Removing RLS (or equivalent) as a mandatory database enforcement layer
- Putting `tenant_id` on Person as the primary isolation key
- Granting Identity or Authorization through Membership type
- Client-exposed Service Role / RLS bypass
- Default shared Business Data across tenants
- Using JWT tenant claims as the sole RLS trust root without trusted backend binding

---

## Rejected Alternatives

### Application-only security (no RLS)

Rejected. Privileged clients and query mistakes can bypass application filters. Conflicts with ADR-001/002 and Data Security isolation requirements.

### RLS-only security (no application Tenant Context)

Rejected. Authorization, Automation and AI require explicit Tenant Context independent of SQL. Conflicts with ADR-002.

### `persons.tenant_id` for simpler RLS

Rejected by ADR-001. Person isolation remains relationship-derived.

### Membership-based RLS as authorization

Rejected. Membership is belonging only. Authorization remains Security Platform.

### Client-trusted JWT `tenant_id` as sole database policy input

Rejected. Clients must not set isolation boundaries. Trusted backend must bind Tenant Context after Authentication and Authorization.

### Service Role for ordinary user traffic

Rejected. Bypass would collapse defense in depth and risk cross-tenant exposure.

### Treating Identity rows as tenant Business Data via Membership

Rejected. Identity is Security Platform data; Membership does not grant Identity access.

---

## Related Domains

- ADR-001 Foundation Identity Model
- ADR-002 Tenant Isolation Model
- Data Model: Multitenancy, Data Security, Entities, Relationships
- Security: Principles, Identity, Authentication, Authorization, Permissions, RBAC, Security Policies, Audit
- API Security: Tenant Context per request
- Platform Architecture: Tenant Architecture, Tenant Identity
- Constitution: Security Philosophy / multi-tenant by design

---

## Decision Rule

Until superseded, every Foundation Phase design and implementation that introduces database access to tenant-owned, territory-linked or relationship-derived Person data must comply with this Database Security and RLS Model.
