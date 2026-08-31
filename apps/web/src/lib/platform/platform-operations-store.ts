/**
 * In-memory SaaS control-plane trail.
 * Extends AdminAuditLog. Does not store secrets, tokens, or resident data.
 */

import {
  createAdminAuditLog,
  detectCrossTenantSecurityEvent,
  detectInvalidPermissionEvent,
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
    input.field === "tenantId" || input.field === "territoryId"
      ? detectCrossTenantSecurityEvent({
          actorTenantId: input.tenantId ?? "unknown",
          requestedTenantId: "spoofed",
          actorPersonId: input.actorPersonId,
          action: "security.cross_tenant",
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
  security = [row, ...security].slice(0, SECURITY_CAP);
  return row;
}

export function recordCrossTenantDenied(input: {
  actorTenantId: string;
  requestedTenantId: string;
  actorPersonId?: string;
}): PlatformSecurityEvent | null {
  const event = detectCrossTenantSecurityEvent(input);
  if (!event) return null;
  security = [event, ...security].slice(0, SECURITY_CAP);
  return event;
}
