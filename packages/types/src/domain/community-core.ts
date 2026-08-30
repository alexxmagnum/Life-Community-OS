import type { DomainId, IsoDateTimeString } from "./ids";
import type {
  CommunityGroupStatus,
  CommunityGroupType,
  CommunityGroupVisibility,
} from "./community-group";

/**
 * Community Core — tenant-owned social domain.
 * Tenant remains the SaaS aggregator. Community data is Territory-scoped.
 */

export type CommunityPostStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived";

export type CommunityPostKind =
  | "member_update"
  | "discussion"
  | "announcement"
  | "proposal";

export type CommunityEventStatus = "draft" | "published" | "cancelled" | "archived";

export type CommunityCommentStatus = "published" | "hidden" | "archived";

export type CommunityReactionKind = "acknowledge" | "support";

export type CommunityTargetType = "post" | "event" | "comment";

export type CommunityNotificationKind =
  | "post_published"
  | "event_created"
  | "mention"
  | "official_alert";

export type CommunityGroupRecord = {
  id: DomainId;
  tenantId: DomainId;
  /** Territory community — tenant remains the SaaS aggregator. */
  territoryId?: DomainId;
  name: string;
  description: string;
  imageUrl?: string;
  categoryLabel?: string;
  groupType: CommunityGroupType;
  visibility: CommunityGroupVisibility;
  status: CommunityGroupStatus;
  createdBy: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CommunityPost = {
  id: DomainId;
  tenantId: DomainId;
  territoryId?: DomainId;
  groupId?: DomainId;
  authorPersonId: DomainId;
  authorDisplayName: string;
  kind: CommunityPostKind;
  title: string;
  body: string;
  status: CommunityPostStatus;
  createdBy: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CommunityEvent = {
  id: DomainId;
  tenantId: DomainId;
  territoryId?: DomainId;
  groupId?: DomainId;
  authorPersonId: DomainId;
  authorDisplayName: string;
  title: string;
  description: string;
  startsAt: IsoDateTimeString;
  endsAt?: IsoDateTimeString;
  locationLabel?: string;
  status: CommunityEventStatus;
  createdBy: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CommunityCommentRecord = {
  id: DomainId;
  tenantId: DomainId;
  postId?: DomainId;
  eventId?: DomainId;
  authorPersonId: DomainId;
  authorDisplayName: string;
  body: string;
  status: CommunityCommentStatus;
  createdBy: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CommunityReaction = {
  id: DomainId;
  tenantId: DomainId;
  personId: DomainId;
  targetType: CommunityTargetType;
  targetId: DomainId;
  kind: CommunityReactionKind;
  createdBy: DomainId;
  createdAt: IsoDateTimeString;
};

export type CommunitySave = {
  id: DomainId;
  tenantId: DomainId;
  personId: DomainId;
  targetType: CommunityTargetType;
  targetId: DomainId;
  createdBy: DomainId;
  createdAt: IsoDateTimeString;
};

export type CommunityNotificationRecord = {
  id: DomainId;
  tenantId: DomainId;
  recipientPersonId: DomainId;
  kind: CommunityNotificationKind;
  title: string;
  body: string;
  entityType?: CommunityTargetType;
  entityId?: DomainId;
  readAt?: IsoDateTimeString;
  createdBy?: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CommunityDomainSnapshot = {
  groups: CommunityGroupRecord[];
  posts: CommunityPost[];
  events: CommunityEvent[];
  comments: CommunityCommentRecord[];
  reactions: CommunityReaction[];
  saves: CommunitySave[];
  notifications: CommunityNotificationRecord[];
};

export function emptyCommunityDomain(): CommunityDomainSnapshot {
  return {
    groups: [],
    posts: [],
    events: [],
    comments: [],
    reactions: [],
    saves: [],
    notifications: [],
  };
}
