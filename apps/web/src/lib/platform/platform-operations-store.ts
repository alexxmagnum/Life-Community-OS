/**
 * In-memory SaaS control-plane trail.
 * Extends AdminAuditLog. Does not store secrets, tokens, or resident data.
 */

import {
  createAdminAuditLog,
  detectAdminChangeEvent,
  detectCrossTenantSecurityEvent,
  detectInvalidPermissionEvent,
  detectTerritoryMismatchEvent,
  type AdminAuditLog,
  type PlatformSecurityEvent,
} from "@life-community-os/types";

const AUDIT_CAP = 200;
const SECURITY_CAP = 100;

let audit: AdminAuditLog[] = [];
let security: PlatformSecurityEvent[] = [];

export function replacePlatformOperationsStoreForTests(): void {
  audit = [];
  security = [];
}

export function listPlatformAudit(): AdminAuditLog[] {
  return [...audit];
}

export function listPlatformSecurityEvents(): PlatformSecurityEvent[] {
  return [...security];
}

export function recordPlatformAudit(input: {
  tenantId: string;
  territoryId?: string;
  actorPersonId: string;
  action: AdminAuditLog["action"];
  entityType: AdminAuditLog["entityType"];
  entityId: string;
  metadata?: AdminAuditLog["metadata"];
}): AdminAuditLog {
  const entry = createAdminAuditLog({
    tenantId: input.tenantId,
    territoryId: input.territoryId,
    actorPersonId: input.actorPersonId,
    actorRole: "platform_operator",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  });
  audit = [entry, ...audit].slice(0, AUDIT_CAP);
  return entry;
}

export function recordSpoofSecurityEvent(input: {
  field: string;
  actorPersonId?: string;
  tenantId?: string;
}): PlatformSecurityEvent {
  const event =
    input.field === "tenantId"
      ? detectCrossTenantSecurityEvent({
          actorTenantId: input.tenantId ?? "unknown",
          requestedTenantId: "spoofed",
          actorPersonId: input.actorPersonId,
          action: "security.cross_tenant",
        })
      : input.field === "territoryId"
        ? detectTerritoryMismatchEvent({
            actorTerritoryId: input.tenantId ?? "unknown",
            requestedTerritoryId: "spoofed",
            tenantId: input.tenantId,
            actorPersonId: input.actorPersonId,
            action: "security.territory_mismatch",
          })
        : detectInvalidPermissionEvent({
            tenantId: input.tenantId,
            actorPersonId: input.actorPersonId,
            action: "security.permission.changed",
          });
  const row =
    event ??
    detectInvalidPermissionEvent({
      tenantId: input.tenantId,
      actorPersonId: input.actorPersonId,
    });
  pushSecurity(row);
  recordPlatformAudit({
    tenantId: input.tenantId ?? "unknown",
    actorPersonId: input.actorPersonId ?? "unknown",
    action: "security.permission.changed",
    entityType: "security",
    entityId: input.field,
    metadata: { field: input.field },
  });
  return row;
}

function pushSecurity(row: PlatformSecurityEvent): void {
  security = [row, ...security].slice(0, SECURITY_CAP);
}

export function recordCrossTenantDenied(input: {
  actorTenantId: string;
  requestedTenantId: string;
  actorPersonId?: string;
}): PlatformSecurityEvent | null {
  const event = detectCrossTenantSecurityEvent(input);
  if (!event) return null;
  pushSecurity(event);
  recordPlatformAudit({
    tenantId: input.actorTenantId,
    actorPersonId: input.actorPersonId ?? "unknown",
    action: "security.permission.changed",
    entityType: "security",
    entityId: input.requestedTenantId,
    metadata: { kind: "cross_tenant" },
  });
  return event;
}

export function recordTerritoryMismatch(input: {
  actorTerritoryId: string;
  requestedTerritoryId: string;
  tenantId?: string;
  actorPersonId?: string;
}): PlatformSecurityEvent | null {
  const event = detectTerritoryMismatchEvent(input);
  if (!event) return null;
  pushSecurity(event);
  recordPlatformAudit({
    tenantId: input.tenantId ?? "unknown",
    actorPersonId: input.actorPersonId ?? "unknown",
    action: "security.permission.changed",
    entityType: "security",
    entityId: input.requestedTerritoryId,
    metadata: { kind: "territory_mismatch" },
  });
  return event;
}

export function recordInvalidPermission(input: {
  tenantId?: string;
  actorPersonId?: string;
  action?: string;
}): PlatformSecurityEvent {
  const event = detectInvalidPermissionEvent(input);
  pushSecurity(event);
  return event;
}

export function recordAdminChange(input: {
  tenantId?: string;
  actorPersonId?: string;
  action?: string;
}): PlatformSecurityEvent {
  const event = detectAdminChangeEvent(input);
  pushSecurity(event);
  return event;
}
