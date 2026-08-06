# ADR-002 Tenant Isolation Model

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

Existing documentation establishes that:

- every request executes inside one Tenant Context (Data Model — Multitenancy);
- Business Data is never shared by default;
- no cross-tenant reads, writes, updates or deletes;
- Tenant is the isolation and commercial root (ADR-001);
- Territory belongs to exactly one Tenant; a Tenant may have many Territories (ADR-001);
- Person has no direct `tenant_id`; tenant visibility is derived through Membership → Territory → Tenant (ADR-001);
- Identity, Authentication and Authorization belong to the Security Platform;
- Membership is domain belonging only, never authorization (ADR-001);
- AI never accesses another Tenant’s data (Tenant Model);
- Automation executes inside Tenant boundaries and never crosses isolation (Tenant Model).

Foundation identity tables exist. Isolation enforcement is not yet implemented.

This ADR defines the Tenant Isolation architecture for Foundation Phase and subsequent enforcement work.

It does not implement RLS policies, migrations or application code.

---

## Decisions

### 1. Tenant Context

#### What Tenant Context represents

Tenant Context is the explicit runtime isolation boundary for a single request or automated execution.

It determines:

- Ownership
- Visibility
- Permissions evaluation scope
- Business Scope
- Isolation

Nothing executes in an ambiguous or implicit tenant scope.

Platform Data (for example Countries, Currencies, Languages, Timezones, System Configuration, Feature Catalog, Platform Roles) may be readable outside tenant ownership, but still under an explicit Platform Context — never as “no context”.

#### When Tenant Context is created

Tenant Context is created at the start of each:

- authenticated user request;
- privileged platform operation that targets a tenant;
- automation job;
- AI execution that consumes tenant data.

Tenant Context is discarded at the end of that execution unit.

Tenant Context is never inferred silently from residual session state without re-validation.

#### How Tenant Context flows through requests

```
Request / Job
  ↓
Resolve Identity (if authenticated)
  ↓
Resolve Tenant Context (explicit)
  ↓
Authorize action within Tenant Context
  ↓
Access Domain data scoped by Tenant Context
  ↓
Complete / audit
```

Application services, database adapters, automation runners and AI adapters must receive Tenant Context explicitly.

Infrastructure clients (including Supabase) must not be used in a way that bypasses Tenant Context for tenant-owned data, except controlled Platform Service Role operations that still declare an explicit target Tenant Context.

---

### 2. Tenant Resolution

The platform determines the active Tenant using an ordered, explicit resolution strategy.

#### Resolution order (Foundation)

1. **Explicit platform context**  
   When a trusted platform operation declares `tenant_id` (admin tooling, provisioning, system jobs), that declaration is authoritative after Authorization succeeds.

2. **Territory relationship**  
   When the request targets a Territory (or a resource owned through Territory), active Tenant is `territory.tenant_id`.

3. **Membership**  
   When the actor is a Person acting through Membership, Tenant is derived as:

   ```
   Membership → Territory → Tenant
   ```

   If multiple Memberships exist across Territories/Tenants, the request must select an active Territory (or equivalent explicit tenant selector). Ambiguity is rejected.

4. **Authenticated identity**  
   Authentication Identity identifies who is acting and links to Person.  
   Identity alone does **not** define Tenant.  
   Identity enables Membership/Territory resolution; it never substitutes for Tenant Context.

#### Rules

- Exactly one active Tenant Context per execution unit.
- Cross-tenant access requires an explicit governed operation (invitation, federation, partner integration) and is out of Foundation Phase default behaviour.
- Failure to resolve Tenant Context for tenant-owned operations fails closed (deny).

---

### 3. Territory Scope

#### How Territory relates to Tenant isolation

- Territory is tenant-owned (`territories.tenant_id`).
- Territory is the primary community environment scope inside a Tenant.
- Membership is territory-scoped and therefore tenant-scoped through Territory.
- Person is not territory-owned and not tenant-owned; Person becomes visible inside a Tenant only through valid Membership (and Authorization).

#### How data access is scoped

| Data class | Scope key | Access rule |
|------------|-----------|-------------|
| Tenant-owned rows with `tenant_id` | `tenant_id = Tenant Context` | Must match active Tenant Context |
| Territory-owned / territory-linked rows | via `territory_id` → `territories.tenant_id` | Must resolve to active Tenant Context |
| Membership | `territory_id` → Tenant | Readable/writable only within active Tenant Context |
| Person | no `tenant_id` | Accessible only when Membership (or later explicit grant) links Person into active Tenant Context |
| Platform Data | Platform Context | Globally shared reference data; not tenant Business Data |

Discovery, administration and future domain entities that belong geographically to Territory inherit Tenant isolation through Territory.

---

### 4. Database Isolation Strategy

#### Decision

Use **defense in depth**:

1. **Application-level enforcement (mandatory)**  
   Every application path must resolve Tenant Context and scope queries/commands to that tenant before touching tenant-owned data.

2. **Database-level enforcement (mandatory for tenant-owned tables)**  
   PostgreSQL Row Level Security (RLS), or an equivalent database enforcement mechanism, must protect tenant-owned data so that accidental unscoped queries cannot cross tenants.

3. **RLS strategy (Foundation direction)**  
   - Enable RLS on tenant-owned tables (at minimum `tenants` access control, `territories`, `memberships`, and later domain tables with `tenant_id` or territory linkage).  
   - Session/request tenant identifier is provided through a controlled database setting or equivalent claim bound to Tenant Context.  
   - `persons` does not use `tenant_id` RLS; Person policies are relationship-derived (Membership → Territory → Tenant).  
   - `identities` remain Security Platform data; access is not granted by Membership.  
   - Service-role / platform operations may bypass RLS only inside explicitly authorized platform procedures that still log Tenant Context.

#### Chosen approach explanation

- Data Model Multitenancy requires isolation but intentionally does not prescribe RLS syntax.
- ADR-001 requires RLS or equivalent for Territory/Membership protection and relationship-derived Person visibility.
- Application-only enforcement is insufficient against query mistakes and privileged clients.
- Database-only enforcement without application Tenant Context is insufficient for authorization, automation and AI boundaries.
- Therefore both layers are required.

Foundation implementation sequence:

1. Application Tenant Context contracts and query scoping first.
2. RLS policies second (separate implementation task / migration), without changing this ADR.

---

### 5. Security Boundaries

| Concern | Owner | Responsibility |
|---------|-------|----------------|
| Identity | Security Platform | Who is performing this action? |
| Authentication | Security Platform | Verify Identity |
| Authorization | Security Platform | May this Identity perform this action within Tenant Context? |
| Membership | Domain | Where/how does this Person belong? Never grants actions |
| Tenant Isolation | Platform Security + Data enforcement | Prevent cross-tenant data access |

Order of evaluation:

```
Identity
  ↓
Authentication
  ↓
Tenant Context resolution
  ↓
Authorization (within Tenant Context + policies)
  ↓
Domain operations (Membership informs belonging, not permission)
```

Membership type must never be treated as a permission, role or authorization grant.

---

### 6. AI and Automation Isolation

#### Artificial Intelligence

- AI executes inside one Tenant Context.
- AI cannot read, write, embed, train on, or infer from another Tenant’s Business Data.
- AI providers and prompts must receive only data already authorized under the active Tenant Context.
- AI never defines Tenant Context and never bypasses Authorization.

#### Automation

- Automation workflows execute inside Tenant boundaries.
- Triggers, jobs and side effects remain tenant-scoped unless an explicit cross-tenant contract exists.
- Automation never silently crosses Tenant isolation.
- Platform-wide automations that operate across tenants must iterate explicit Tenant Contexts one at a time and audit each boundary.

---

## Consequences

1. All Foundation application services must accept/propagate Tenant Context.
2. Database adapters must support scoped access patterns; unscoped tenant-data access is forbidden in application code.
3. RLS implementation becomes a required follow-up engineering task, not optional hardening.
4. Person queries must join/filter through Membership → Territory for tenant-scoped use cases.
5. Multi-membership users require an explicit active Territory/Tenant selection mechanism.
6. Observability must record Tenant Context on security-relevant events, including denied cross-tenant attempts.
7. White-label and commercial isolation remain attached to Tenant, not Territory.

---

## Security Impact

- Fail-closed Tenant resolution reduces accidental data leakage.
- Dual enforcement (application + database) reduces single-point failure risk.
- Clear separation prevents Membership from becoming a shadow authorization system.
- AI/Automation constraints close common multi-tenant exfiltration paths.
- Privileged service-role usage remains exceptional and auditable.

---

## Future Evolution

Allowed without superseding this ADR:

- Implementing RLS policies consistent with this model
- Tenant selector UX for multi-membership actors
- Explicit cross-tenant invitation/federation flows with dedicated contracts
- Territory-linked domain tables inheriting the same isolation pattern
- Stronger session binding of Tenant Context to auth tokens/claims

Requires a superseding ADR:

- Shared Business Data across tenants by default
- Removing database-level enforcement permanently
- Resolving Tenant solely from authentication Identity without Membership/Territory/explicit context
- Allowing AI to train on cross-tenant aggregates of Business Data

---

## Rejected Alternatives

### Application-only isolation (no database enforcement)

Rejected because privileged clients and query mistakes can bypass application filters. ADR-001 and Security require durable isolation.

### Database-only isolation (no application Tenant Context)

Rejected because Authorization, Automation and AI need an explicit Tenant Context independent of SQL filters.

### Tenant = Identity

Rejected because Identity answers who acts; Tenant answers which ecosystem owns the data. Conflating them breaks multi-membership and multi-territory participation.

### Tenant = Membership

Rejected because Membership is belonging, not commercial isolation or authorization scope root.

### Putting `tenant_id` on Person for simpler RLS

Rejected by ADR-001. Isolation must remain relationship-derived for Person.

### Implicit tenant from host header alone without authorization

Rejected as sole resolver. Host/brand may assist resolution but cannot replace authenticated/authorized Tenant Context for Business Data access.

---

## Related Domains

- ADR-001 Foundation Identity Model
- Data Model: Multitenancy, Data Security
- Platform Architecture: Tenant Architecture, Tenant Identity
- Business Platform: Tenant Model
- Security: Identity, Authentication, Authorization, Security Policies
- Constitution: Security Philosophy / Non-Negotiables (multi-tenant by design)

---

## Decision Rule

Until superseded, every Foundation Phase design and implementation that touches Tenant-owned or Territory-linked data must comply with this Tenant Isolation Model.
