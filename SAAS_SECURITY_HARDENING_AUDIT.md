# SAAS_SECURITY_HARDENING_AUDIT.md

**Phase:** 17W — SaaS Security Hardening & Compliance Foundation  
**Date:** 2026-09-01  
**Constraint:** Protect existing domains. No GlobalSecurityEntity, UniversalPermissionEntity, SecurityScore, ComplianceScore, GlobalBanSystem, CrossTenantAdmin, or PlatformContentAccess. Never `if tenant === panoramica`.

Hierarchy: PLATFORM → TENANT → TERRITORY → DOMAIN DATA.

---

## 1. Security Control Plane

`packages/types/src/platform/security-context.ts`

`SecurityPolicyContext` defines SaaS security rules:

- isolation: tenantIsolation, territoryIsolation
- permissions: platformAccess, communityAccess
- policies: exportAllowed, restoreAllowed, mediaAccess

It does not store content, users, activity, or scores.

---

## 2. Request security pipeline

Request → Session Validation → Tenant Resolution → Territory Resolution → Capability Check → Permission Check → Domain Operation.

The server always resolves actor, tenant, territory, and permissions. The client cannot supply `tenantId`, `territoryId`, `role`, `capability`, or `permission` as authority.

---

## 3. Tenant isolation

`assertTenantBoundary()`:

- Tenant A cannot read, modify, export, or restore Tenant B → `cross_tenant_access_denied`
- Territory A cannot read or modify Territory B → `territory_boundary_violation`

Luxury Communities Inc (Panorámica, Ocean Hills, Valley) share a SaaS customer and do not share territory data.

---

## 4. Authorization centralization

`AuthorizationService.authorize({ actor, action, resource, context })` → ALLOW | DENY.

Examples:

- member + experienceCreate → ALLOW
- member + tenantSuspend → DENY
- communityAdministrator + platformFeatureChange → DENY
- platformOperator + tenantLifecycle → ALLOW

---

## 5. Capability protection

Capabilities remain product configuration. Client-sent `capability` / `capabilities` is `client_capability_spoof` (403). The server computes membership + tenant features + role + context.

---

## 6. Platform Admin security

Create tenant, suspend tenant, change plan/limits, export, and restore require Platform Operator + permission + audit.

Community Admin may operate a territory, moderate, and manage activity. It cannot touch the SaaS control plane (`403 saas_control_plane_forbidden`).

---

## 7. Privileged confirmation

Suspend tenant, restore backup, and delete configuration require explicit confirmation after permission check, then audit, then execute.

---

## 8. Admin audit security

New actions: `security.login.failed`, `security.permission.denied`, `security.cross_tenant.blocked`, `security.export.requested`, `security.restore.requested`, `security.admin.action`.

Metadata is sanitized. Password, token, secret, cookie, and api_key are never stored.

---

## 9. Media security

`assertMediaOwnership()` — media tenant A used by tenant B is denied. Storage keys, media references, and restore operations stay tenant-owned.

---

## 10. Secret management foundation

Frontend must not contain service keys, database secrets, or private tokens. Backend owns secrets, storage access, and privileged operations. Secrets are not written to logs, audit, or errors.

---

## 11. Privacy foundation

`PrivacyControlContext` is a contract only: export personal data, delete account, anonymize identity, retention policies. Full deletion, portability, and automatic retention are not implemented.

---

## 12. Security Events API

`GET /api/platform/security/events` returns technical incidents, blocked access, invalid attempts, and boundary violations. It does not return private messages, social activity, or unnecessary personal data.

---

## 13. Platform Admin — Security Center

`/platform/admin` Security Center: Boundary Events, Permission Denials, Audit Security, Configuration Risks. Operational SaaS control, not a SIEM, external system, or ranking.

---

## Invariants

Tenant ≠ Territory. Platform ≠ Community Admin. Plan ≠ Permission. Feature ≠ Authorization. Backup ≠ Data duplication. Security ≠ Domain Data.
