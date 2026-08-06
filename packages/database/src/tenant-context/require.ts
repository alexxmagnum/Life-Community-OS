import type { DomainId, TenantContext } from "@life-community-os/types";

import {
  TenantContextMismatchError,
  UnresolvedTenantContextError,
} from "./errors";

/**
 * Fail closed: tenant-owned operations require a resolved Tenant Context.
 */
export function requireTenantContext(
  context: TenantContext | null | undefined,
): TenantContext {
  if (!context?.tenantId) {
    throw new UnresolvedTenantContextError();
  }
  return context;
}

/**
 * Ensure a persistence row's tenant_id matches the active Tenant Context.
 */
export function assertTenantOwnership(
  context: TenantContext,
  rowTenantId: DomainId,
): void {
  const active = requireTenantContext(context);
  if (rowTenantId !== active.tenantId) {
    throw new TenantContextMismatchError(
      `Expected tenant ${active.tenantId}, received ${rowTenantId}.`,
    );
  }
}

/**
 * When Territory scope is required by the operation, fail closed if missing.
 */
export function requireTerritoryScope(context: TenantContext): DomainId {
  const active = requireTenantContext(context);
  if (!active.territoryId) {
    throw new UnresolvedTenantContextError(
      "Territory scope is required for this Tenant Context operation.",
    );
  }
  return active.territoryId;
}
