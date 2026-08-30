import type { DomainId, IsoDateTimeString } from "./ids";

export type TenantStatus =
  | "provisioned"
  | "trial"
  | "active"
  | "suspended"
  | "archived"
  | "deleted";

/**
 * SaaS customer / independent ecosystem.
 * Owns billing, branding, capabilities and commercial configuration.
 * Does not represent a physical community — that is Territory.
 * Source: public.tenants + ADR-001
 */

export interface Tenant {
  id: DomainId;
  publicSlug: string;
  displayName: string;
  configuration: Record<string, unknown>;
  status: TenantStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
