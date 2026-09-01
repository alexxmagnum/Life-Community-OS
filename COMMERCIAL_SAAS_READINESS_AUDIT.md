# COMMERCIAL_SAAS_READINESS_AUDIT.md

**Phase:** 17Z — Commercial SaaS Readiness & Customer Operations  
**Date:** 2026-09-01  
**Constraint:** No GlobalCustomerEntity, UniversalBillingUser, CustomerClone, CommercialCommunityEntity, SaaSMarketingEntity, or GlobalSubscriptionPermission. Never `if tenant === panoramica`.

Hierarchy: PLATFORM → TENANT → TERRITORY → PERSON → MEMBERSHIP → DOMAIN DATA.

---

## 1. TenantCustomerContext

`packages/types/src/platform/customer-context.ts`

Projects commercial relationship only: companyName, contact, onboardingStatus, plan, features, limits. Does not store end users, messages, or community content.

---

## 2. Customer onboarding flow

States: `requested` → `configuring` → `ready` | `suspended`

Flow: Customer request → Tenant created → Territory configured → Branding → Features → Administrator invited → Community ready.

No CommunityClone.

---

## 3. TenantActivationService

Actions: initializeTenant, configureTenant, activateFeatures, inviteAdministrator, completeOnboarding.

Audit: `platform.customer.created`, `platform.customer.onboarding.started`, `platform.customer.ready`.

---

## 4. Plan vs permissions

Plans: starter, community, premium, enterprise. Plan defines features and limits only — never grants administrator role.

---

## 5. ProductFeatureCatalog

Catalog keys: lifeMap, experiences, reservations, marketplace, services, housing, community, business.

Feature ≠ Capability. Catalog defines product availability; AuthZ decides who can use it.

---

## 6. CustomerOperationsContext

Support projection: tenant status, configuration status, features, limits, health, subscription (billingProvider: none). No private messages or personal data.

---

## 7. Platform Admin

Surface: `/platform/customers`  
API: `/api/platform/customers`

Community Admin receives `403 saas_control_plane_forbidden` for SaaS mutations.

---

## 8. Validation

- `pnpm -r typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm --filter @life-community-os/types test` — 215 PASS
- `pnpm --filter @life-community-os/web test:isolation` — 350 PASS
- `pnpm --filter @life-community-os/web build` — PASS

---

## 9. Invariants

Tenant ≠ Territory · Person ≠ Membership · Feature ≠ Authorization · Plan ≠ Permission · Customer ≠ Community Data
