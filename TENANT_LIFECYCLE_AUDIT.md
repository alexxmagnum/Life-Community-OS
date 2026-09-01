# TENANT_LIFECYCLE_AUDIT.md

**Phase:** 17U — SaaS Governance, Tenant Lifecycle & Platform Maturity  
**Date:** 2026-09-01  
**Constraint:** Operate tenant lifecycle without mixing community life. No GlobalCommunityManager, TenantOverrideLogic, CustomerSpecificTenant, PlatformContentStore, UniversalBusinessRules, or GlobalModerationAuthority. Never `if tenant === panoramica`.

---

## 1. Tenant Lifecycle Model

`packages/types/src/platform/tenant-lifecycle.ts`

```
TenantLifecycleContext {
  tenantId
  status: draft | provisioning | active | suspended | archived
  allowedTransitions
  suspended
  dataPreserved
  authBlocked
  mutationsBlocked
}
```

Transiciones:

```
draft → provisioning → active → suspended → active
suspended → archived
archived → active  solo vía restoreTenant() (operación explícita)
```

---

## 2. Tenant Lifecycle Service

`TenantLifecycleService` (contrato) + `TenantLifecycleRuntime` (runtime)

- activateTenant()
- suspendTenant()
- archiveTenant()
- restoreTenant()
- setPlan() / setLimits()

No modifica contenido, usuarios finales ni dominios.

---

## 3. Suspension Safety

Suspender **no elimina datos**.

| Superficie | Comportamiento |
|---|---|
| Authentication de miembros | bloqueada (`tenant_suspended`) |
| Nuevas mutaciones | bloqueadas |
| Lectura pública anónima | permitida (política) |
| Datos / territories | conservados |

Audit: `platform.tenant.suspended` con actor, tenantId, reason. Sin password/token/secret.

---

## 4. Tenant Contract

`TenantSaaSContract` (contrato comercial SaaS)

```
tenantId, plan, features, limits, status, effectiveFrom, effectiveUntil
```

Distinto de `TenantContract` runtime (identidad / branding / packs).

Plan ≠ permisos. Features ≠ AuthZ.

---

## 5. Product Limits

`TenantLimits { territories, members, storage, resources }`

- Community: territories = 1
- Enterprise: unlimited (`null`)

Los límites son producto, no seguridad.

---

## 6. Platform Admin

`/platform/admin` + GET/POST `/api/platform/lifecycle`

Por tenant: estado, Activate / Suspend / Restore / Archive, contrato, límites, subscriptionStatus.

No muestra mensajes privados ni actividad personal.

---

## 7. Community Admin separation

`/admin/operations` territorial.

403 `saas_control_plane_forbidden` para:

- suspender tenant
- cambiar plan
- cambiar límites
- modificar contrato SaaS
- activar features globales

---

## 8. Billing preparation

`TenantSubscription.subscriptionStatus`: trial | active | past_due | cancelled  
`billingProvider: "none"` — sin Stripe.

---

## 9. Audit extension

- platform.tenant.activated
- platform.tenant.suspended
- platform.tenant.restored
- platform.tenant.archived
- platform.contract.changed
- platform.limit.changed

Metadata sanitizada.

---

## 10. Security validation

El servidor decide. Rechaza del cliente: tenantId, status, plan, limits, permissions.

Platform Operator opera SaaS. Community Admin solo territorio. Member solo comunidad.

---

## 11. Multi-tenant tests

Luxury Communities Inc (Panorámica, Ocean Hills, Valley) aislado de Tenant B.  
Tenant suspendido no crea contenido. Community Admin no accede Platform.

---

## 12. Tests & commit

| # | Caso | Resultado |
|---|---|---|
| 1 | Crear tenant lifecycle | PASS |
| 2 | Activar tenant | PASS |
| 3 | Suspender tenant | PASS |
| 4 | Restaurar tenant | PASS |
| 5 | Archivar tenant | PASS |
| 6 | Community Admin bloqueado | PASS |
| 7 | Plan separado de permisos | PASS |
| 8 | Limits separados de AuthZ | PASS |
| 9 | Audit completo | PASS |
| 10 | Valley separado de Panorámica | PASS |
