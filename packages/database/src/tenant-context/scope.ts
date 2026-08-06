import type { DomainId, TenantContext } from "@life-community-os/types";

import { requireTenantContext } from "./require";

/**
 * Contract for any future database query/command that touches tenant-owned data.
 * Queries must receive Tenant Context explicitly (ADR-002).
 */
export interface TenantScopedOperation {
  readonly tenantContext: TenantContext;
}

/**
 * Filter values derived from Tenant Context for future query builders.
 * Does not execute queries and does not implement RLS.
 */
export type TenantScopeFilter = {
  tenantId: DomainId;
  territoryId?: DomainId;
};

export function toTenantScopeFilter(
  context: TenantContext | null | undefined,
): TenantScopeFilter {
  const active = requireTenantContext(context);
  return {
    tenantId: active.tenantId,
    ...(active.territoryId ? { territoryId: active.territoryId } : {}),
  };
}

/**
 * Marker helper: future repositories should accept TenantScopedOperation.
 */
export function asTenantScopedOperation(
  tenantContext: TenantContext,
): TenantScopedOperation {
  return { tenantContext: requireTenantContext(tenantContext) };
}
