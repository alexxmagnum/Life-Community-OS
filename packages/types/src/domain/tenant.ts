import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * SaaS customer / independent ecosystem.
 * Source: public.tenants + ADR-001
 */
export type TenantStatus =
  | "provisioned"
  | "trial"
  | "active"
  | "suspended"
  | "archived"
  | "deleted";

export interface Tenant {
  id: DomainId;
  publicSlug: string;
  displayName: string;
  configuration: Record<string, unknown>;
  status: TenantStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
