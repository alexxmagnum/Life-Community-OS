import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Optional organizational geography inside a Territory (ADR-005).
 * Product language may say “Micro Area”. Not a security boundary.
 */
export type CommunityArea = {
  id: DomainId;
  tenantId: DomainId;
  territoryId: DomainId;
  name: string;
  /** Optional parent for nested areas (ADR-005). */
  parentAreaId?: DomainId;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};
