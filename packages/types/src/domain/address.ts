import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Physical location layer (ADR-006). Always Territory-scoped. Not a security boundary.
 */
export type Address = {
  id: DomainId;
  tenantId?: DomainId;
  territoryId: DomainId;
  /** Optional Community Area organization (ADR-005). */
  communityAreaId?: DomainId;
  line1?: string;
  line2?: string;
  locality?: string;
  postalCode?: string;
  countryCode?: string;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};
