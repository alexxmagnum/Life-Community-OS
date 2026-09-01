/**
 * Tenant launch operations — Platform Operator only.
 */

export const TENANT_LAUNCH_STATUSES = [
  "created",
  "configured",
  "ready",
  "launched",
] as const;

export type TenantLaunchStatus = (typeof TENANT_LAUNCH_STATUSES)[number];

export const TENANT_LAUNCH_CHECK_ITEMS = [
  "tenant_created",
  "territory_configured",
  "branding_ready",
  "features_configured",
  "admin_invited",
  "validation_complete",
  "launch_approved",
] as const;

export type TenantLaunchCheckItem = (typeof TENANT_LAUNCH_CHECK_ITEMS)[number];

export type TenantLaunchChecklist = {
  tenantId: string;
  status: TenantLaunchStatus;
  items: Record<TenantLaunchCheckItem, boolean>;
  updatedAt: string;
  launchedAt?: string;
};

export function emptyLaunchChecklist(tenantId: string): TenantLaunchChecklist {
  const items = Object.fromEntries(
    TENANT_LAUNCH_CHECK_ITEMS.map((key) => [key, false]),
  ) as Record<TenantLaunchCheckItem, boolean>;
  return {
    tenantId,
    status: "created",
    items,
    updatedAt: new Date().toISOString(),
  };
}

export function deriveLaunchStatus(
  checklist: TenantLaunchChecklist,
): TenantLaunchStatus {
  const values = TENANT_LAUNCH_CHECK_ITEMS.map((key) => checklist.items[key]);
  if (checklist.launchedAt && values.every(Boolean)) return "launched";
  if (values.every(Boolean)) return "ready";
  if (values.some(Boolean)) return "configured";
  return "created";
}

export function projectTenantLaunchChecklist(input: {
  tenantId: string;
  items: Partial<Record<TenantLaunchCheckItem, boolean>>;
  launchedAt?: string;
  updatedAt?: string;
}): TenantLaunchChecklist {
  const base = emptyLaunchChecklist(input.tenantId);
  const items = { ...base.items, ...input.items };
  const checklist: TenantLaunchChecklist = {
    tenantId: input.tenantId,
    status: "created",
    items,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    ...(input.launchedAt ? { launchedAt: input.launchedAt } : {}),
  };
  return { ...checklist, status: deriveLaunchStatus(checklist) };
}

export function launchChecklistComplete(
  checklist: TenantLaunchChecklist,
): boolean {
  return TENANT_LAUNCH_CHECK_ITEMS.every((key) => checklist.items[key]);
}
