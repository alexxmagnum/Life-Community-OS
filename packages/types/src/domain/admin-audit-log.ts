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
  "governance.review",
  "governance.safety",
  "territory.assign_asset",
  "settings.update",
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
  | "tenant_settings";

export type AdminAuditLog = {
  id: DomainId;
  tenantId: DomainId;
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
    actorPersonId: input.actorPersonId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    reason: input.reason,
    metadata: input.metadata,
    createdAt: now,
  };
}
