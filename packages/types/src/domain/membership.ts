import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Belonging of a Person within a Territory (ADR-011).
 * Not an auth account (User) and not the Person record.
 * membershipType is the capability role (member | group_manager | moderator | administrator).
 * Source: public.memberships + ADR-001
 *
 * Community Area resource eligibility is NOT stored here —
 * derive from PropertyPersonRelationship (ADR-037).
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
