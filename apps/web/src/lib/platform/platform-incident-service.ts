/**
 * Platform incident service — lightweight incident tracking, not a SIEM.
 */

import type { RequestActor } from "@/lib/auth/request-actor";
import {
  SAAS_CONTROL_PLANE_FORBIDDEN,
  canAccessPlatformAdmin,
  createPlatformIncident,
  updatePlatformIncidentStatus,
  type PlatformIncidentContext,
  type PlatformIncidentStatus,
} from "@life-community-os/types";
import {
  TenantFactoryDeniedError,
  TenantFactoryRuntime,
} from "@/lib/tenant/tenant-factory-service";
import {
  listProductionIncidents,
  saveProductionIncident,
} from "@/lib/platform/production-readiness-store";
import { recordPlatformAudit } from "@/lib/platform/platform-operations-store";

function requireOperator(actor: RequestActor): string {
  if (!actor.authenticated || !actor.personId) {
    throw new TenantFactoryDeniedError("unauthorized");
  }
  if (
    !canAccessPlatformAdmin({
      personId: actor.personId,
      operators: TenantFactoryRuntime.snapshot().operators,
    })
  ) {
    throw new TenantFactoryDeniedError(SAAS_CONTROL_PLANE_FORBIDDEN);
  }
  return actor.personId;
}

function newId(prefix: string): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") return `${prefix}-${c.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

export const PlatformIncidentService = {
  list(): PlatformIncidentContext[] {
    return listProductionIncidents();
  },

  create(input: {
    actor: RequestActor;
    title: string;
    description: string;
    tenantId?: string;
  }): PlatformIncidentContext {
    const personId = requireOperator(input.actor);
    const incident = createPlatformIncident({
      id: newId("incident"),
      title: input.title,
      description: input.description,
      createdBy: personId,
      tenantId: input.tenantId,
    });
    saveProductionIncident(incident);
    recordPlatformAudit({
      tenantId: incident.tenantId ?? "platform",
      actorPersonId: personId,
      action: "platform.incident.created",
      entityType: "platform",
      entityId: incident.id,
      metadata: {
        status: incident.status,
      },
    });
    return incident;
  },

  update(input: {
    actor: RequestActor;
    incidentId: string;
    status: PlatformIncidentStatus;
  }): PlatformIncidentContext | null {
    const personId = requireOperator(input.actor);
    const existing = listProductionIncidents().find(
      (row) => row.id === input.incidentId,
    );
    if (!existing) return null;
    const incident = updatePlatformIncidentStatus(existing, input.status);
    saveProductionIncident(incident);
    recordPlatformAudit({
      tenantId: incident.tenantId ?? "platform",
      actorPersonId: personId,
      action:
        input.status === "resolved" || input.status === "closed"
          ? "platform.incident.resolved"
          : "platform.incident.updated",
      entityType: "platform",
      entityId: incident.id,
      metadata: { status: incident.status },
    });
    return incident;
  },

  resolve(input: {
    actor: RequestActor;
    incidentId: string;
  }): PlatformIncidentContext | null {
    return this.update({
      actor: input.actor,
      incidentId: input.incidentId,
      status: "resolved",
    });
  },
};
