import type { DomainId, IsoDateTimeString } from "./ids";

/**
 * Community Group / Circle — social organizational layer (ADR-029).
 * Not a Tenant and not a security boundary.
 */

export type CommunityGroupType =
  | "interest_circle"
  | "activity_group"
  | "committee"
  | "official_program"
  | "custom";

export type CommunityGroupVisibility = "territory" | "area" | "members" | "hidden";

export type CommunityGroupStatus = "draft" | "active" | "archived";

export type CommunityGroup = {
  id: DomainId;
  tenantId: DomainId;
  territoryId: DomainId;
  name: string;
  description?: string;
  imageUrl?: string;
  /** Classification label for UI (prefer i18n in product surfaces). */
  categoryLabel?: string;
  groupType?: CommunityGroupType;
  visibility?: CommunityGroupVisibility;
  status: CommunityGroupStatus;
  /** Creating Person id. */
  ownerPersonId: DomainId;
  communityAreaId?: DomainId;
  /** Optional sponsored interest Channel (ADR-035). */
  sponsoredChannelId?: DomainId;
  memberCount?: number;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

export type GroupMembershipStatus = "active" | "invited" | "left" | "removed";

export type GroupMembership = {
  id: DomainId;
  groupId: DomainId;
  personId: DomainId;
  status: GroupMembershipStatus;
  joinedAt?: IsoDateTimeString;
};
