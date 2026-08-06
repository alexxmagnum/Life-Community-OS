# ADR-024 Billing and Plans Model

Version: 1.1
Status: Accepted
Document Type: Architecture Decision Record
Priority: Critical
Date: 2026-08-06
Updated: 2026-08-06

---

## Status

Accepted

---

## Context

Life Community OS is a multi-tenant SaaS platform.

The platform requires flexible commercial plans, Tenant subscriptions, feature availability and usage limits.

Commercial packaging is **organization-based SaaS billing**: the paying customer is the Tenant organization that operates a community environment for its participants.

ADR-014 / ADR-015 place **Plans**, **Subscriptions** and **billing foundations** in Platform Core Commercial services, and require microapps to consume entitlement rather than invent per-module commerce engines.

ADR-023 establishes Configuration & Feature Management: plan entitlement ceilings what can be enabled; feature flags activate; RBAC authorizes actions.

ADR-020 Storage Intelligence calculates tenant storage usage that commercial limits may meter.

ADR-012 keeps Authorization (Roles/Permissions) separate from commercial packaging.

ADR-010 / ADR-011 establish Person and Membership as participants inside a Tenant — not SaaS customers by default.

Open questions:

1. Who is the billing customer versus platform participants?
2. How do Plan, Subscription, Entitlement, Addon and Usage Meter relate?
3. How do billing states interact with feature availability without replacing RBAC?
4. How are usage limits monitored automatically and audited?

This ADR defines the **Billing and Plans Model**.

It does not create migrations or tables.

---

## Decision

**Billing & Plans is a Platform Core capability.**

**Plans define commercial availability through entitlements.**

**The commercial customer is the Tenant organization** (organization-based SaaS billing).

**Billing does not replace authorization.**  
**RBAC remains responsible for permissions.**

### Core rules

1. **Billing is Tenant-scoped** — the Tenant organization is the default billing entity.
2. **Persons, Users and Members are participants**, not the default billing customer.
3. **Plans control availability** (what a Tenant organization may commercially access).
4. **Entitlements control capabilities and limits** (quotas/meters for that Tenant).
5. **Feature flags control activation** within entitlement (ADR-023).
6. **RBAC controls actions** inside activated features (ADR-012).
7. **Usage limits are monitored automatically** at Tenant scope.
8. **Changes are auditable** (ADR-021).
9. Payment providers are replaceable infrastructure behind Core billing foundations.
10. Life Panoramica is a subscribed Tenant organization — not a custom billing fork and not “each resident pays the SaaS by default.”

### Evaluation chain

```
Tenant organization (billing customer)
  → Plan / Addon entitlements (commercial ceiling)
    → Subscription lifecycle allows access?
      → Feature Management enablement (ADR-023)
        → RBAC Permission for the actor (ADR-012)
          → Domain operation
            → Usage metering (+ enforce limits)
              → Audit when relevant
```

---

## Billing Customer Model

### Decision

The **commercial customer is the Tenant organization**.

**Persons, Users and Members** are participants inside the platform and are **not** the default billing entity.

### Supported Tenant customers

Organization-shaped Tenants include (non-exhaustive):

- Residential communities;
- Municipalities;
- Towns;
- Resorts;
- Clubs;
- Organizations.

### Who pays versus who participates

| Actor | Commercial role | Platform role |
|-------|-----------------|---------------|
| **Tenant organization** | Billing customer / subscriber | Isolation + commercial root |
| **Person** | Not default payer | Human identity (ADR-010) |
| **User Account** | Not default payer | Authentication identity |
| **Member (Membership)** | Not default payer | Community participation (ADR-011) |

### Organization billing examples

**Residential community**  
Community of owners (Tenant organization) pays so residents can participate.

**Municipality**  
Town council (Tenant organization) pays so citizens can participate.

**Resort**  
Organization (Tenant organization) pays so guests and members can participate.

### Billing customer rules

1. Invoices, subscriptions, payment methods and commercial contracts attach to the **Tenant**, not to each Person by default.
2. Usage meters (members, storage, notifications, …) measure consumption **of/for the Tenant organization**.
3. A Person with `billing.manage` (or equivalent) may administer billing **on behalf of** the Tenant; that Person is still not the SaaS customer identity.
4. Future optional end-user payments inside Marketplace/Bookings (consumer commerce) are separate from SaaS Tenant billing and require explicit product/ADR scope — they do not redefine the default Billing Customer Model.
5. Changing the billing customer from Tenant organization to Person-default B2C SaaS requires a superseding ADR.

---

## Plan Model

### Plan

A **commercial package** offered to **Tenant organizations** (organization-based SaaS).

A Plan declares:

- target customer shapes (e.g. residential community, municipality, resort) as packaging metadata when useful;
- included microapps / capability bundles for the organization;
- entitlement set (booleans, quotas, rate limits) sized for organizational operation;
- trial eligibility and default terms for Tenant onboarding;
- commercial metadata (name, public marketing code — not Permissions).

Plans package **what the organization may run for its participants**, not personal consumer SKUs as the primary model.

### Plan rules

1. Plans are platform catalogue entities for Tenant organizations (not Tenant-authored security roles).
2. Changing a Plan definition may affect future organization subscriptions; migrations of existing subscribers are governed commercial operations and auditable.
3. Plans never embed Person-level Permissions and never treat “Member” as the billable account type.
4. Quotas such as `members.active_max` meter participant scale **under the paying Tenant**, not per-person SaaS seats as the default customer model.
5. White-label presentation remains Configuration (ADR-023); Plan decides whether white-label is entitled for the organization.

---

## Subscription Model

### Subscription

The **Tenant organization relationship with a Plan** (and optional Addons).

The subscriber is the Tenant commercial customer — not a Person, User Account, or Membership.
### Subscription lifecycle

| Status | Meaning |
|--------|---------|
| `trial` | Time-bounded evaluation access per plan terms |
| `active` | In good standing; entitlements apply |
| `past_due` | Payment failed / overdue; policy may degrade access |
| `paused` | Temporarily suspended by policy or request |
| `cancelled` | End scheduled or completed; wind-down rules apply |
| `expired` | Term ended; entitlements no longer grant availability |

### Subscription rules

1. One primary Subscription per Tenant organization is the Foundation default; multiple concurrent paid subscriptions require an explicit future commercial ADR if needed.
2. Lifecycle transitions are system/commercial-admin operations on the Tenant — Authorization-gated and auditable.
3. `past_due` / `paused` / `cancelled` / `expired` degrade or end **organization** entitlement; they must not leak tenant data cross-tenant.
4. Billing webhooks from providers are backend-only, verified, and mapped into the Tenant Subscription state by Core.
5. Cancelling a Person’s Membership does not cancel the Tenant Subscription; removing the organization’s Subscription affects all participants’ commercial availability gates.

---

## Entitlements

### Entitlement

A **capability, limit or quota granted by a Plan** (and/or Addon).

Types (conceptual):

| Kind | Example |
|------|---------|
| Boolean capability | `marketplace.enabled` |
| Numeric quota | `storage.gb`, `members.active_max` |
| Seat/count limit | `administrators.max` |
| Rate / volume | `notifications.monthly_max` |
| Integration allowance | `integrations.connectors_max` |

### Entitlement vs Feature flag vs Permission

| Mechanism | Controls |
|-----------|----------|
| **Entitlement** | Commercial right / quota ceiling |
| **Feature flag** | Whether the Tenant activated an entitled capability |
| **RBAC Permission** | Whether this actor may perform the action |

All three may be required. None replaces another.

### Enforcement

1. Hard limits deny or block new consuming actions when exceeded (fail closed for write/consume paths).
2. Soft limits may warn via Notifications/Activity without immediate block, per plan policy.
3. Enforcement happens in Core gateways/services shared by microapps — microapps must not invent private quota stores as source of truth.

---

## Usage Metering

### Usage Meter

Tracks **Tenant consumption** against entitlements.

### Usage examples

- active members;
- storage consumption;
- administrators;
- enabled microapps;
- notifications;
- integrations.

Meters may be derived from Core systems (Membership counts, Files storage intelligence — ADR-020, Notifications volume — ADR-019, Configuration enablement — ADR-023).

### Metering rules

1. Meters are Tenant-scoped.
2. Usage is updated automatically from authoritative Core signals where possible.
3. Meter reads for enforcement must be trustworthy enough for commercial decisions (eventual consistency windows are allowed if documented; overage policy must be explicit).
4. Usage dashboards for Tenant admins are Permission-gated.
5. Usage snapshots relevant to billing disputes should be auditable/retainable per commercial policy.

---

## Add-ons

### Addon

An **additional commercial capability** attachable to a Subscription beyond the base Plan.

Examples (illustrative):

- extra storage pack;
- Marketplace enablement;
- additional admin seats;
- premium notification volume;
- specific integration packs.

### Addon rules

1. Addons grant Entitlements stacked on the Plan.
2. Addon lifecycle follows Subscription commercial state (cannot keep Addon active if Subscription is `expired`, unless policy explicitly allows grandfathering).
3. Addons do not create Permissions; they only expand entitlement ceilings / capability booleans.
4. Enabling an Addon may allow Feature Management to turn a flag on — still RBAC-gated for actors.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Billing/subscription/usage isolation boundary |
| Plans / Entitlements | Availability and limits — not AuthZ |
| Feature flags | Activation within entitlement (ADR-023) |
| RBAC | Actions and who can manage billing settings |
| Audit | Plan changes, subscription transitions, entitlement overrides, limit breaches handling |
| Providers | Replaceable; secrets never in clients |
| Disabled / non-entitled features | Must not expose data (ADR-023) |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Subscription lifecycle allows commercial access?
  → Entitlement allows capability / remaining quota?
  → Feature enabled?
  → RBAC Permission?
  → Domain operation + usage increment
  → Audit when relevant
```

### Alignment statements

- The Tenant organization pays; Persons/Members participate.
- Paying for a Plan does not make every Member a Tenant Owner.
- Storage overage uses Files usage intelligence; enforcement is Core commercial policy, not a microapp bucket ACL.
- Billing Portal access is RBAC-gated (`billing.manage` or equivalent) and auditable — administered on behalf of the Tenant.
- Cross-tenant price or usage leakage is forbidden.

---

## Examples

### Example 1 — Residential community (Life Panoramica)

```
Billing customer: Tenant organization "Life Panoramica"
  (community of owners / operating organization pays)
Participants: residents, owners, staff via Membership / roles
Subscription: active
Plan entitlements:
  Community, Services, Incidents = allowed
  Marketplace = not entitled → remains disabled
Quotas (organization-scoped):
  storage.gb, members.active_max, administrators.max, …
```

### Example 2 — Municipality

```
Billing customer: Town council (Tenant organization)
Pays for: citizen participation environment
Participants: citizens / residents as Members/Persons
Plan: Municipality / public-community packaging
Meters: active members, notifications, storage, enabled microapps
```

### Example 3 — Resort

```
Billing customer: Resort organization (Tenant)
Pays for: guests and members operating environment
Participants: guests, members, staff
Addons: e.g. extra storage, premium notification volume
```

### Example 4 — Availability vs Permission

```
Tenant entitled + Incidents enabled
Actor (Person/Member) lacks incidents.manage
Result: member create allowed if permitted; admin queues denied
Billing customer remains the Tenant organization
```

### Example 5 — Storage meter (organization usage)

```
Files Storage Intelligence → Tenant storage consumption
Usage Meter: storage (organization)
If consumption > entitlement → block new uploads / warn per policy
Individual Persons are not separately invoiced for SaaS storage by default
```

### Example 6 — Lifecycle degradation

```
Tenant Subscription: active → past_due
Policy: grace period then disable non-essential microapps for the organization
Participants keep identity/membership records; commercial availability gates close
RBAC unchanged; entitlement/feature gates close surfaces
Audit: subscription.status_changed (Tenant-scoped)
```

### Example 7 — Addon

```
Tenant organization on Base Plan without Marketplace
Purchases Addon: Marketplace Pack (organization invoice)
Entitlement marketplace.enabled = true
Admin may enable Marketplace feature flag
Actors still need Marketplace Permissions
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Choose payment providers (Stripe, etc.) or tax engines;
- Define price lists, currencies, invoicing layouts, or dunning copy;
- Implement marketplace seller payouts (separate commerce concerns);
- Replace RBAC with “plan role” strings;
- Define crypto billing or multi-primary subscriptions without a later ADR;
- Make usage analytics a substitute for security Audit;
- Fork billing code per Tenant;
- Make Person/Member the default SaaS billing customer;
- Define Marketplace consumer checkout as SaaS subscription billing.

---

## Rejected Alternatives

### Person / User / Member as default billing customer

Rejected. Commercial customer is the Tenant organization (residential community, municipality, resort, club, organization, etc.). Participants are not invoiced as the SaaS subscriber by default.

### Billing grants Permissions directly

Rejected (ADR-012). Entitlement ≠ Authorization.

### Per-microapp billing engines

Rejected (ADR-015). Commercial Core must be shared.

### Feature flags without plan entitlement

Rejected as the only control. Flags activate within commercial ceiling (ADR-023).

### Manual-only usage tracking

Rejected. Usage limits must be monitored automatically.

### Subscription state without Tenant scoping

Rejected. Billing is Tenant-scoped to the organization customer.

### Ignoring Audit on plan/subscription changes

Rejected (ADR-021).

---

## Related Domains

- ADR-014 Microapp Platform Architecture
- ADR-015 Platform Core Services Model
- ADR-023 Configuration and Feature Management Model
- ADR-020 Files, Media and Automated Storage Intelligence Model
- ADR-012 Roles and Permissions Model
- ADR-021 Audit and Activity Tracking Model
- ADR-019 Notifications and Communication Model
- ADR-003 Database Security and RLS Model
- Business Platform: Tenant Model / commercial packaging

---

## Decision Rule

Until superseded, commercial packaging must go through Platform Core Billing & Plans as **organization-based SaaS billing**: the Tenant organization is the billing customer; Persons/Users/Members are participants; Plans/Addons grant Entitlements; Subscriptions bind Tenant organizations to lifecycle states; Feature Management activates within entitlement; RBAC authorizes actors; Usage Meters enforce organization quotas automatically; and billing changes remain auditable — never treating billing as a replacement for Authorization or Tenant isolation, and never defaulting the SaaS invoice to individual participants.
