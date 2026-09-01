# TENANT_DATA_OPERATIONS_AUDIT.md

**Phase:** 17V — Tenant Data Operations, Backup & Disaster Recovery  
**Date:** 2026-09-01  
**Constraint:** Operate tenant-scoped export, backup and restore without mixing community life. No GlobalBackupDatabase, UniversalDataSnapshot, TenantClone, CustomerSpecificMigration, or PlatformContentCopy. Never `if tenant === panoramica`.

---

## 1. Data Operations Audit

PostgreSQL (Supabase) remains the persistence source of truth. Tenant Factory snapshot remains the SaaS control-plane source of truth. No duplicated SoT.

| Class | Contents |
|---|---|
| A) Platform | tenants registry, operators, SaaS contracts, control-plane audit |
| B) Tenant | metadata, plan, features, limits, lifecycle, membership references |
| C) Territory | territories owned by tenant |
| D) Domain | tenant-owned records and media references |

Backup is an infrastructure operation. It is not a logical copy of community content (no messages, no private activity).

---

## 2. Tenant Export

`packages/types/src/platform/data-export.ts`  
`TenantDataExportService.exportTenant()`

Exports: tenant metadata, territories, membership references, domain ownership records, media references, allowed audit metadata.

Never: secrets, tokens, passwords, other tenants.

API: `GET/POST /api/platform/data-export` — Platform Operator only.

---

## 3. Backup Model

`TenantBackupContext`: backupId, tenantId, createdAt, status, size, checksum, type.

Types: `manual | scheduled | migration`.

Backup Tenant A never contains Tenant B. Isolation checks: tenant_id, territory_id, storage ownership.

---

## 4. Restore Service

`TenantRestoreService.restoreTenant()`

States: requested → validating → running → completed | failed.

Restore is tenant-isolated. Territories included. Audit generated.

Never restore a backup onto another tenant (`cross_tenant_restore_forbidden`).  
Active tenant overwrite requires `explicitConfirmation`.

Lifecycle `platform.tenant.restored` remains status restore. Data restore is `platform.backup.restored`.

---

## 5. Disaster Recovery readiness

`DisasterRecoveryReadiness`

- RPO: 60 minutes
- RTO: 240 minutes
- `cloudProvider: "none"` — contract only, no external cloud infra

Scenarios: data_loss, partial_corruption, infrastructure_failure, individual_tenant_restore.

---

## 6. Media ownership

Media remains tenant-owned.

`mediaStorageBelongsToTenant(storageKey, tenantId)`  
`mediaOwnedByTenant`  
orphan / cross-tenant media rejected.

No public leakage. No cross-tenant restore of storage keys.

---

## 7. Audit extension

- platform.backup.created
- platform.backup.restored
- platform.export.started
- platform.export.completed
- platform.restore.failed

Always: actor, tenantId, timestamp, sanitized metadata.

---

## 8. Platform Admin

`/platform/admin` surface `data_operations`.

- Export tenant
- View backups
- Restore tenant (explicit confirmation)
- Recovery status (RPO/RTO)

Does not show private messages or personal activity.

---

## 9. Community Admin / Security

Community Admin cannot export, backup, restore, or set backupId / restoreTarget / exportScope.

403 `saas_control_plane_forbidden`.

Client never controls: tenantId, backupId, restoreTarget, exportScope. Server validates. Restore target is the resolved community, never a client-supplied tenant.

---

## 10. Tests

| # | Case | Result |
|---|---|---|
| 1 | Export tenant correcto | PASS |
| 2 | Export no incluye otro tenant | PASS |
| 3 | Backup tenant aislado | PASS |
| 4 | Restore tenant correcto | PASS |
| 5 | Restore tenant incorrecto rechazado | PASS |
| 6 | Media ownership validado | PASS |
| 7 | Audit generado | PASS |
| 8 | Community Admin sin acceso | PASS |
| 9 | Valley separado de Panorámica | PASS |
| 10 | No existe TenantClone | PASS |

---

## 11. Invariants

Tenant ≠ Territory  
Platform ≠ Community Admin  
Plan ≠ Permission  
Backup ≠ Data duplication  
