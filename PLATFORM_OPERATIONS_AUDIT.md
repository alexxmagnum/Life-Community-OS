# PLATFORM_OPERATIONS_AUDIT.md

**Phase:** 17T — Platform Operations, Observability & SaaS Control Plane  
**Date:** 2026-09-01  
**Constraint:** Operate tenants without mixing community life. No GlobalCommunityEntity, PlatformContentEntity, UniversalAnalyticsEntity, UserRanking, EngagementScore, CrossTenantDashboardData, or FeatureScore.

---

## 1. Auditoría operativa inicial

| Superficie | Clasificación | Uso en 17T |
|---|---|---|
| Tenant Factory (`packages/types/src/tenant/factory.ts`) | A — operativa plataforma | Provision / territory / plan / features overlay |
| Tenant Registry + Manifest | A — operativa plataforma | Observar tenants ya configurados (Panorámica, Valley, Ocean Hills) |
| `/platform/admin` | A — operativa plataforma | Control plane SaaS |
| `/admin/operations` | C — territorio | Community Admin territorial |
| Authentication / RequestActor | A + B | Membership bind; never client-declared tenant |
| Authorization (`CAPABILITIES`) | B — tenant (RBAC) | Separado de plan y de product features |
| Feature Management (`tenant-contract`, packs) | B — tenant config | Solo se observa; no se reescribe el contrato |
| Billing | A — operativa plataforma | `TenantSubscription` sin pagos |
| AdminAuditLog | A + C | Extendido con acciones `platform.*` / `security.*` |
| Deployment / provisioning | A | Estados `created → configuring → ready → suspended → archived` |

No se duplican usuarios, contenido, ni rankings. El snapshot de factory es el registro SaaS; los dominios de comunidad siguen en sus repositorios.

---

## 2. Platform Operations Context

Contrato: `packages/types/src/platform/operations.ts`

```
PlatformOperationsContext {
  tenantsCount
  activeTenants
  territoriesCount
  featuresUsage
  systemHealth
  alerts
}
```

Runtime: `PlatformOperationsRuntime.context()` — agregados. No carga usuarios finales ni contenido.

---

## 3. Tenant Health

```
TenantHealthContext {
  tenantId
  status: active | suspended | provisioning | archived
  territories
  enabledFeatures
  lastActivity
  configurationStatus
}
```

Sin datos privados de residentes.

---

## 4. Feature Observability

`TenantFeatureObservability` muestra ON/OFF por tenant:

- Marketplace
- Life Map
- Reservations

`featuresForPlan` permanece la fuente comercial. `TenantFactoryService.setFeatures` es overlay SaaS y registra `platform.feature.changed`. Feature Management (`tenant-contract`) no se modifica. No existe FeatureScore.

---

## 5. Audit Logs

`AdminAuditLog` extendido:

- `platform.tenant.created`
- `platform.territory.created`
- `platform.feature.changed`
- `platform.admin.action`
- `security.permission.changed`

Campos: actor, tenantId, territoryId, action, timestamp, metadata. `sanitizeAuditMetadata` elimina secretos/tokens.

---

## 6. Platform Admin

Ruta: `/platform/admin`

Superficies: Tenants · Territories · Features · Plans · Security Events · Audit Logs

APIs: `/api/platform/{tenants,territories,operations,features,health,provisioning,audit,security}`

No muestra mensajes privados, contenido comunitario, ni datos personales innecesarios.

---

## 7. Community Admin separation

`/admin/operations` opera territorio (avisos, gobernanza, actividad local).

Community Admin **no puede**:

- crear tenants
- cambiar planes
- activar features globales (`PATCH /api/admin/settings` → `saas_features_forbidden`)
- listar el registro SaaS (`GET /api/admin/tenants` queda acotado al tenant del actor)

`canMutateSaasControlPlane(false) === false`

---

## 8. Billing readiness

```
Tenant → TenantPlan → Features → Limits
TenantSubscription { tenantId, plan, features, limits, billingProvider: "none" }
```

Sin Stripe. El plan no concede permisos (`billingPlanDoesNotGrantPermissions`).

---

## 9. Security observability

Detecta:

- intentos cross-tenant (`resolveReadTenantId` / `resolveWriteTenantId`)
- permisos inválidos (Community Admin → factory)
- acceso territorial incorrecto (`territory_mismatch`)
- cambios administrativos (`platform.admin.action`)

Integra Governance + AuditLog + PlatformOperations. No hay sistema de seguridad paralelo.

---

## 10. Deployment operations

Provisioning:

1. create tenant
2. create territory
3. configure features
4. ready

Estados: `created | configuring | ready | suspended | archived`

No toca contenido existente. Tenants ya configurados se observan vía `adoptConfiguredTenant`.

---

## 11. Multi-tenant validation

- Luxury Communities Inc: Panorámica · Ocean Hills · Valley (territories del mismo cliente SaaS)
- Tenant B / Tenant C: clientes SaaS separados
- Packs: `life-panoramica`, `life-valley`, `life-ocean-hills` no mezclan usuarios, features, contenido ni configuración

---

## 12. Tests

| # | Caso | Resultado |
|---|---|---|
| 1 | Platform Admin crea Tenant | PASS |
| 2 | Platform Admin crea Territory | PASS |
| 3 | Community Admin no puede crear Tenant | PASS |
| 4 | Tenant isolation | PASS |
| 5 | Feature observability | PASS |
| 6 | AuditLog registra cambios | PASS |
| 7 | Security event cross-tenant detectado | PASS |
| 8 | Billing plan separado de permissions | PASS |
| 9 | Valley separado de Panorámica | PASS |
| 10 | No existe GlobalCommunityEntity | PASS |

Suites: `packages/types/src/platform/operations.test.ts`, `apps/web/src/lib/platform/platform-operations-isolation.test.ts`

---

## 13. Commit

Phase 17T — SaaS control plane: Platform Operations Context, Tenant Health, feature observability, audit/security events, `/platform/admin`, billing-ready `TenantSubscription`, community-admin separation.
