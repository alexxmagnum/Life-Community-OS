# ADR-023 Configuration and Feature Management Model

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

Life Community OS is a multi-tenant SaaS platform.

Each Tenant requires different enabled modules, branding and operational configuration **without creating custom code**.

ADR-014 defines microapps as reusable modules enableable per Tenant via registry and Tenant Configuration.

ADR-015 places **Tenant settings** and **feature configuration** in Platform Core, alongside commercial plans/subscriptions that gate entitlement.

ADR-021 requires privileged configuration changes to be auditable through Core Audit.

Open questions:

1. How do feature flags relate to plans, microapp enablement and RBAC?
2. What is the override hierarchy (platform → tenant → area → user)?
3. How does white-label branding stay configuration rather than forked product code?
4. How are disabled features kept from exposing data?

This ADR defines the **Configuration and Feature Management Model**.

It does not create migrations or tables.

---

## Decision

**Configuration & Feature Management is a Platform Core service.**

It controls **tenant customization** and **feature availability**.

It does **not** replace permissions or security.

### Core rules

1. **Configuration does not grant permissions.**
2. **RBAC controls access** to read/change configuration and to perform actions inside enabled features.
3. **Feature flags do not replace authorization.**
4. **Disabled features must not expose data** (API, search, UI, notifications, exports).
5. **Changes should be auditable** (ADR-021).
6. Configuration is data/policy — not customer-specific codebase forks.
7. Life Panoramica is a configured Tenant instance, not a separate product branch.

```
Commercial entitlement (plans/subscriptions)
        │
        ▼
Feature Management (enable microapps / capabilities)
        │
        ▼
Configuration hierarchy (defaults → tenant → area → user)
        │
        ▼
Runtime gates (UI + API + jobs) + RBAC on actions
```

---

## Feature Management

### Purpose

Control **what exists** for a Tenant (and optionally Territory/Area), not **who may act**.

### Capabilities

| Capability | Meaning |
|------------|---------|
| Enable/disable microapps | e.g. Community, Services, Incidents, Marketplace |
| Enable/disable capabilities | Feature slices inside a microapp (announcements, voting, …) |
| Plan-based availability | Entitlement from Commercial Core constrains what can be enabled |

### Evaluation order for availability

```
Plan/subscription allows feature?
  → Tenant (or Territory) feature flag enabled?
    → Runtime surface may appear
      → RBAC Permission still required for the action
```

If any availability gate fails, the feature is unavailable.  
If availability passes but Permission fails, the action is denied.

### Disabled feature data rule

When a microapp/capability is disabled for a Tenant:

1. Member/admin UI entry points are hidden.
2. Application APIs reject new operations for that feature (fail closed).
3. Search/discovery must not return disabled-feature entities as active results (ADR-022 alignment).
4. Notifications for that feature’s new events should not fan out (ADR-019 alignment).
5. Existing data remains tenant-isolated; retention is operational policy — disable ≠ cross-tenant expose and ≠ “delete without governance.”

### Feature flags vs experiments

Product experiments may use flags, but Tenant security, RLS and RBAC remain mandatory. Flags never create a second tenancy model.

---

## Configuration Hierarchy

Configuration resolves from broad defaults to specific overrides.

| Layer | Scope | Examples |
|-------|--------|----------|
| **Platform defaults** | All Tenants | Default locale list, default microapp baselines, system limits |
| **Tenant overrides** | One Tenant | Enabled modules, branding, languages, operational defaults |
| **Area overrides** | Community Area within Tenant/Territory | Local notice defaults, area-specific operational settings where product allows |
| **User preferences** | Person / User Account | Notification channel prefs, UI density — not security policy |

### Resolution rules

1. More specific layers override broader ones only where the setting is declared overridable.
2. Security, isolation and Permission evaluation are **not** overridable by user preferences.
3. Area overrides are **organizational configuration**, not a security boundary (ADR-005 alignment).
4. Unknown keys fail safe (ignore or deny) per schema — no silent execution of arbitrary code.
5. Configuration schemas are versioned; invalid overrides do not boot a Tenant into an insecure open mode.

### What configuration is allowed to change

- Feature availability (within plan entitlement);
- Branding / white-label presentation;
- Locales and language availability;
- Operational defaults (SLA targets display, digest schedules, …);
- Microapp options that do not bypass AuthZ/Tenant Context.

### What configuration must not change

- Tenant isolation rules;
- RLS model;
- RBAC replacement;
- Cross-tenant data sharing defaults;
- Service Role exposure.

---

## White Label

White-label presentation is **Tenant configuration**, not a code fork.

### Configurable branding elements

| Element | Purpose |
|---------|---------|
| Name | Tenant display name |
| Logo | Brand mark (via Core Files references — ADR-020) |
| Colors | Theme tokens |
| Domains | Custom hostnames / brand domains |
| Languages | Available locales / default language |

### White-label rules

1. Domains may assist Tenant resolution but **cannot** be the sole Business Data Tenant Context without Authentication/Authorization rules (ADR-002 alignment).
2. Logos/media use Core Files — not per-tenant unmanaged buckets as architecture.
3. White-label must not disable Audit, RBAC, or Tenant isolation.
4. Multiple Territories under one Tenant may share Tenant branding; Area-level cosmetic overrides are optional product configuration, not separate SaaS tenants.

---

## Security Alignment

| Concern | Rule |
|---------|------|
| Tenant | Security boundary; configuration is tenant-scoped |
| Feature flags | Availability only — not Permissions |
| RBAC | Who can view/edit configuration; who can act inside features |
| Disabled features | Must not expose data via any surface |
| Audit | Configuration and feature-flag changes append Audit Events |
| Area overrides | Organizational only |
| Commercial plans | Entitlement ceiling for enablement |

### Evaluation order

```
Identity
  → Authentication
  → Tenant Context (fail closed)
  → Read effective configuration (hierarchy)
  → Feature availability gate
  → Authorization (RBAC) for the action
  → Domain operation
  → Audit (especially config mutations)
```

### Alignment statements

- Enabling Community does not make every Member a `community_admin`.
- Disabling Marketplace must close Marketplace APIs for that Tenant.
- Platform defaults must not leak Tenant overrides across Tenants.
- Privileged configuration APIs are admin-Permission gated and auditable.

---

## Examples

### Example 1 — Life Panoramica modules

```
Tenant: Life Panoramica
Enabled: Community, Services, Incidents
Disabled: Marketplace
```

Same platform code; configuration differs from a Tenant that enables Marketplace.

### Example 2 — Capability slice

```
Community enabled
  announcements: enabled
  voting: enabled
  proposals: enabled
  discussions: disabled
```

### Example 3 — White label

```
Tenant overrides:
  name: Life Panoramica
  logo: file reference
  colors: brand palette
  domains: community.lifepanoramica.example
  languages: es, en
```

### Example 4 — Availability vs Permission

```
Incidents enabled for Tenant
Person lacks incidents.manage
Result: may create member requests if permitted; cannot access admin queues
```

### Example 5 — Audited change

```
Admin disables Marketplace
Audit Event: configuration.update / feature.disable
Activity (if allowed): "Marketplace disabled"
```

---

## Non-goals

This ADR does not:

- Create migrations or tables;
- Implement a specific feature-flag vendor;
- Define the full settings catalogue or JSON schemas;
- Replace Commercial billing/checkout flows;
- Define CMS for arbitrary tenant scripts/themes beyond safe tokens;
- Allow Tenants to upload executable plugin code as “configuration”;
- Make user preferences able to enable admin microapps;
- Fork the codebase per white-label customer.

---

## Rejected Alternatives

### Custom codebase per Tenant

Rejected. Platform must scale by configuration (ADR-014).

### Feature flag = Permission

Rejected (ADR-012). Availability ≠ Authorization.

### Disabled feature still queryable via API/search

Rejected. Violates “must not expose data.”

### Area configuration as Tenant isolation

Rejected. Area remains organizational (ADR-005).

### Unaudited production flag changes

Rejected for security-sensitive configuration (ADR-021).

### Branding domain alone authorizes Tenant Business Data access

Rejected (ADR-002).

---

## Related Domains

- ADR-014 Microapp Platform Architecture
- ADR-015 Platform Core Services Model
- ADR-021 Audit and Activity Tracking Model
- ADR-012 Roles and Permissions Model
- ADR-022 Search and Discovery Platform Model
- ADR-019 Notifications and Communication Model
- ADR-020 Files and Media Management Model
- ADR-002 Tenant Isolation Model
- Platform Architecture: Tenant Branding / Multi-tenant Branding

---

## Decision Rule

Until superseded, Tenant customization and module availability must be managed through Platform Core Configuration & Feature Management: plan entitlement and flags control availability, hierarchy resolves effective settings, white-label remains configuration, RBAC remains Authorization, disabled features must not expose data, and configuration changes must be auditable — never replaced by per-tenant custom code.
