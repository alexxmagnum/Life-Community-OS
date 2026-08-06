/**
 * Fail-closed Tenant Context errors (ADR-002).
 */

export class UnresolvedTenantContextError extends Error {
  readonly code = "UNRESOLVED_TENANT_CONTEXT" as const;

  constructor(message = "Tenant Context is required and was not resolved.") {
    super(message);
    this.name = "UnresolvedTenantContextError";
  }
}

export class TenantContextMismatchError extends Error {
  readonly code = "TENANT_CONTEXT_MISMATCH" as const;

  constructor(message = "Resource tenant does not match active Tenant Context.") {
    super(message);
    this.name = "TenantContextMismatchError";
  }
}
