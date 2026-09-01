# SAAS_ANALYTICS_BI_AUDIT.md

**Phase:** 18B — Platform Analytics & Business Intelligence Foundation  
**Date:** 2026-09-01  
**Constraint:** No GlobalAnalyticsEntity, UserTrackingEntity, EngagementScore, ResidentRanking, CommunityScore, PersonalBehaviorGraph, CrossTenantAnalyticsStore, or AdvertisingProfile. Never `if tenant === panoramica`.

Hierarchy: PLATFORM → TENANT → TERRITORY → PERSON → MEMBERSHIP → DOMAIN DATA.

---

## 1. PlatformBusinessIntelligenceContext

`packages/types/src/platform/business-intelligence.ts`

Aggregated SaaS metrics: tenantCount, activeTenantCount, planDistribution, featureAdoption, operationalHealth, capacityUsage. No personal data, messages, or social engagement.

---

## 2. TenantAnalyticsContext

Per-tenant product, capacity, product health, and operational health. Not social engagement.

---

## 3. Feature adoption & capacity

`TenantFeatureUsage` — active vs contracted vs unconfigured features.  
`TenantCapacityContext` — limits vs usage (territories, members, storage, resources). Near-limit detection does not change permissions.

---

## 4. Customer Success integration

`analyticsInsightsForCustomerSuccess` surfaces configuration gaps, limit proximity, and support needs. Does not auto-contact end users.

---

## 5. Platform Analytics Center

Surface: `/platform/analytics`  
APIs: `/api/platform/analytics`, `/api/platform/analytics/tenants`, `/api/platform/reports`

Community Admin receives `403 saas_control_plane_forbidden`.

---

## 6. Audit

Actions: `platform.analytics.viewed`, `platform.report.generated`, `platform.analytics.exported`.

---

## 7. Validation

- `pnpm -r typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm --filter @life-community-os/types test` — 245 PASS
- `pnpm --filter @life-community-os/web test:isolation` — 380 PASS
- `pnpm --filter @life-community-os/web build` — PASS

---

## 8. Invariants

Analytics ≠ Tracking · Health ≠ Engagement · Privacy ≠ Analytics · Customer ≠ Community
