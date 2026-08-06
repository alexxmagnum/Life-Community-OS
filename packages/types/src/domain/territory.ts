import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Geographical or functional community environment.
 * Belongs to exactly one Tenant. Source: public.territories + ADR-001
 */
export interface Territory {
  id: DomainId;
  tenantId: DomainId;
  name: string;
  description: string | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
