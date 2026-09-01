/**
 * Platform incident management — operational incidents, not a SIEM.
 */

export const PLATFORM_INCIDENT_STATUSES = [
  "detected",
  "investigating",
  "resolved",
  "closed",
] as const;

export type PlatformIncidentStatus =
  (typeof PLATFORM_INCIDENT_STATUSES)[number];

export type PlatformIncidentContext = {
  id: string;
  tenantId?: string;
  title: string;
  description: string;
  status: PlatformIncidentStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: string;
};

export function createPlatformIncident(input: {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  tenantId?: string;
  now?: string;
}): PlatformIncidentContext {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    title: input.title.trim(),
    description: input.description.trim(),
    status: "detected",
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
  };
}

export function updatePlatformIncidentStatus(
  incident: PlatformIncidentContext,
  status: PlatformIncidentStatus,
  now?: string,
): PlatformIncidentContext {
  const at = now ?? new Date().toISOString();
  return {
    ...incident,
    status,
    updatedAt: at,
    ...(status === "resolved" || status === "closed"
      ? { resolvedAt: at }
      : {}),
  };
}

export function incidentRespectsTenantScope(
  incident: PlatformIncidentContext,
  tenantId: string,
): boolean {
  return !incident.tenantId || incident.tenantId === tenantId;
}
