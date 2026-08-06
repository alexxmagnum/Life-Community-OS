import type {
  ExecutionContext,
  PlatformContext,
  TenantContext,
  TenantContextCarrier,
} from "@life-community-os/types";

import { UnresolvedTenantContextError } from "./errors";
import { requireTenantContext } from "./require";

/**
 * Extract Tenant Context from a request/job carrier.
 * Fail closed when missing — never infer silently (ADR-002).
 */
export function resolveTenantContextFromCarrier(
  carrier: TenantContextCarrier,
): TenantContext {
  return requireTenantContext(carrier.tenantContext);
}

/**
 * Require tenant-owned execution scope.
 * Platform Context is explicit but cannot authorize tenant Business Data access.
 */
export function requireTenantExecution(
  context: ExecutionContext | null | undefined,
): TenantContext {
  if (!context || context.kind !== "tenant") {
    throw new UnresolvedTenantContextError(
      "Tenant execution context is required for tenant-owned operations.",
    );
  }
  return requireTenantContext(context.tenant);
}

/**
 * Require explicit Platform Context (Platform Data only).
 */
export function requirePlatformExecution(
  context: ExecutionContext | null | undefined,
): PlatformContext {
  if (!context || context.kind !== "platform") {
    throw new UnresolvedTenantContextError(
      "Platform execution context is required for platform-scoped operations.",
    );
  }
  return context.platform;
}
