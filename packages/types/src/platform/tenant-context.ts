import type { DomainId, IsoDateTimeString } from "../domain/ids";

/**
 * How Tenant Context was resolved (ADR-002).
 * Identity alone never defines Tenant.
 */
export type TenantResolutionSource =
  | "explicit_platform"
  | "territory"
  | "membership";

/**
 * Explicit runtime isolation boundary for one request or job.
 * Determines ownership, visibility, authorization scope and isolation.
 */
export interface TenantContext {
  /** Active Tenant (SaaS ecosystem / isolation root). */
  tenantId: DomainId;
  /**
   * Optional Territory scope inside the Tenant.
   * Required when resolution came from Territory or Membership.
   */
  territoryId?: DomainId;
  /** Documented resolution source from ADR-002. */
  resolutionSource: TenantResolutionSource;
  /** When this context was created for the execution unit. */
  createdAt: IsoDateTimeString;
  /** Optional correlation id for the request/job. */
  requestId?: string;
}

/**
 * Explicit Platform Context for Platform Data access.
 * Never substitute for Tenant Context on Business Data.
 */
export interface PlatformContext {
  createdAt: IsoDateTimeString;
  requestId?: string;
  /** Why platform scope is used (must remain explicit). */
  reason: string;
}

/**
 * Execution scope for any operation.
 * Ambiguous / missing scope is forbidden.
 */
export type ExecutionContext =
  | { kind: "tenant"; tenant: TenantContext }
  | { kind: "platform"; platform: PlatformContext };

/**
 * Carrier contract for request/job pipelines.
 * Does not perform Identity, Authentication or Authorization.
 */
export interface TenantContextCarrier {
  tenantContext: TenantContext | null;
}
