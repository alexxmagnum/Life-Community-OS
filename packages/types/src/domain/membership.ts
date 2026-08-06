import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Belonging of a Person within a Territory.
 * Not authorization. Type is configurable.
 * Source: public.memberships + ADR-001
 */
export type MembershipStatus = "active" | "inactive" | "ended";

export interface Membership {
  id: DomainId;
  personId: DomainId;
  territoryId: DomainId;
  membershipType: string;
  status: MembershipStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
