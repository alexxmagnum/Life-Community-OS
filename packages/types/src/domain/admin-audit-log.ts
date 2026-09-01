/**
 * AdminAuditLog — operational trail for community staff actions.
 * Not a parallel domain. Records who did what to an existing entity.
 */

import type { DomainId, IsoDateTimeString } from "./ids";

export const ADMIN_AUDIT_ACTIONS = [
  "membership.role_change",
  "membership.block",
  "membership.invite",
  "business.approve",
  "business.suspend",
  "resource.update",
  "resource.maintenance",
  "reservation.cancel",
  "content.hide",
  "content.archive",
  "content.restore",
  "content.publish",
  "governance.review",
  "governance.safety",
  "territory.assign_asset",
  "settings.update",
  "platform.tenant.created",
  "platform.territory.created",
  "platform.feature.changed",
  "platform.admin.action",
  "platform.tenant.activated",
  "platform.tenant.suspended",
  "platform.tenant.restored",
  "platform.tenant.archived",
  "platform.contract.changed",
  "platform.limit.changed",
  "platform.backup.created",
  "platform.backup.restored",
  "platform.export.started",
  "platform.export.completed",
  "platform.restore.failed",
  "security.permission.changed",
  "security.login.failed",
  "security.permission.denied",
  "security.cross_tenant.blocked",
  "security.export.requested",
  "security.restore.requested",
  "security.admin.action",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export type AdminAuditEntityType =
  | "membership"
  | "person"
  | "business"
  | "resource"
  | "reservation"
  | "post"
  | "comment"
  | "listing"
  | "help_request"
  | "governance_report"
  | "safety_action"
  | "territory_object"
  | "tenant_settings"
  | "tenant"
  | "territory"
  | "platform"
  | "security"
  | "backup"
  | "export"
  | "restore";

const SENSITIVE_METADATA_KEY =
  /secret|token|password|authorization|cookie|api[_-]?key|private/i;

export function sanitizeAuditMetadata(
  metadata?: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> | undefined {
  if (!metadata) return undefined;
  const next: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEY.test(key)) continue;
    next[key] = value;
  }
  return Object.keys(next).length ? next : undefined;
}

export type AdminAuditLog = {
  id: DomainId;
  tenantId: DomainId;
  territoryId?: DomainId;
  actorPersonId: DomainId;
  actorRole: string;
  action: AdminAuditAction | (string & {});
  entityType: AdminAuditEntityType | (string & {});
  entityId: DomainId;
  reason?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: IsoDateTimeString;
};

export function isAdminAuditAction(value: string): value is AdminAuditAction {
  return (ADMIN_AUDIT_ACTIONS as readonly string[]).includes(value);
}

export function createAdminAuditLog(input: {
  tenantId: string;
  territoryId?: string;
  actorPersonId: string;
  actorRole: string;
  action: AdminAuditLog["action"];
  entityType: AdminAuditLog["entityType"];
  entityId: string;
  reason?: string;
  metadata?: AdminAuditLog["metadata"];
}): AdminAuditLog {
  const now = new Date().toISOString();
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  const id =
    typeof c?.randomUUID === "function"
      ? c.randomUUID()
      : `aal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    tenantId: input.tenantId,
    territoryId: input.territoryId?.trim() || undefined,
    actorPersonId: input.actorPersonId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    reason: input.reason,
    metadata: sanitizeAuditMetadata(input.metadata),
    createdAt: now,
  };
}
