/**
 * Community Social Loop — participation around real life, not a social network.
 *
 * Person → Participation → Context (experience / event / group / help).
 * This is a read projection. It does not persist a universal social entity.
 * Do not create SocialPostEntity, UserActivityEntity, FriendEntity, FollowerEntity
 * or a universal InvitationEntity.
 */

export const COMMUNITY_PARTICIPATION_ENTITY_TYPES = [
  "experience",
  "event",
  "group",
  "help",
] as const;

export type CommunityParticipationEntityType =
  (typeof COMMUNITY_PARTICIPATION_ENTITY_TYPES)[number];

export const COMMUNITY_PARTICIPATION_VIEWER_STATUSES = [
  "joined",
  "invited",
  "pending",
  "none",
] as const;

export type CommunityParticipationViewerStatus =
  (typeof COMMUNITY_PARTICIPATION_VIEWER_STATUSES)[number];

export const COMMUNITY_PARTICIPATION_ACTION_KINDS = [
  "join",
  "invite",
  "leave",
  "converse",
  "respond",
] as const;

export type CommunityParticipationActionKind =
  (typeof COMMUNITY_PARTICIPATION_ACTION_KINDS)[number];

export type CommunityParticipationAction = {
  kind: CommunityParticipationActionKind;
  label: string;
  href?: string;
  enabled: boolean;
};

export type CommunityParticipationRoleCount = {
  count: number;
  role: string;
};

export type CommunityParticipationContext = {
  id: string;
  tenantId: string;
  territoryId: string;
  entityType: CommunityParticipationEntityType;
  entityId: string;
  participants: CommunityParticipationRoleCount[];
  viewerParticipation: {
    status: CommunityParticipationViewerStatus;
    role?: string;
  };
  actions: CommunityParticipationAction[];
};

export type CommunityParticipationPrivacy = {
  appearInParticipants: boolean;
  receiveInvitations: boolean;
  showActivity: boolean;
};

export const DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY: CommunityParticipationPrivacy =
  {
    appearInParticipants: true,
    receiveInvitations: true,
    showActivity: true,
  };

export type CommunityOwnActivityItem = {
  id: string;
  title: string;
  href: string;
  startsAt?: string;
  status?: string;
};

export type CommunityOwnActivity = {
  experiencesCreated: CommunityOwnActivityItem[];
  upcomingEvents: CommunityOwnActivityItem[];
  helpOffered: CommunityOwnActivityItem[];
  upcomingReservations: CommunityOwnActivityItem[];
};

export type CommunityParticipationRow = {
  personId: string;
  role: string;
};

export function isCommunityParticipationEntityType(
  value: string,
): value is CommunityParticipationEntityType {
  return (COMMUNITY_PARTICIPATION_ENTITY_TYPES as readonly string[]).includes(
    value,
  );
}

export function isCommunityParticipationViewerStatus(
  value: string,
): value is CommunityParticipationViewerStatus {
  return (COMMUNITY_PARTICIPATION_VIEWER_STATUSES as readonly string[]).includes(
    value,
  );
}

export function participationContextId(
  entityType: CommunityParticipationEntityType,
  entityId: string,
): string {
  return `${entityType}:${entityId.trim()}`;
}

export function aggregateParticipantRoles(
  rows: readonly CommunityParticipationRow[],
): CommunityParticipationRoleCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const role = row.role.trim() || "participant";
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  return [...counts.entries()].map(([role, count]) => ({ role, count }));
}

export function occupyingParticipationCount(
  rows: readonly CommunityParticipationRoleCount[],
): number {
  return rows
    .filter(
      (item) =>
        item.role === "creator" ||
        item.role === "organizer" ||
        item.role === "owner" ||
        item.role === "participant" ||
        item.role === "active" ||
        item.role === "helper",
    )
    .reduce((sum, item) => sum + item.count, 0);
}

export function viewerStatusFromRole(
  role: string | undefined,
): CommunityParticipationViewerStatus {
  if (!role) return "none";
  if (role === "invited") return "invited";
  if (role === "waitlist" || role === "pending") return "pending";
  if (
    role === "cancelled" ||
    role === "left" ||
    role === "removed" ||
    role === "none"
  ) {
    return "none";
  }
  return "joined";
}

export function conversationHrefForParticipation(
  entityType: CommunityParticipationEntityType,
  entityId: string,
): string {
  const id = encodeURIComponent(entityId.trim());
  switch (entityType) {
    case "experience":
      return `/experiences/${id}/conversation`;
    case "event":
      return `/community`;
    case "group":
      return `/community/groups/${id}/conversation`;
    case "help":
      return `/services/work/${id}/conversation`;
  }
}

export function entityHrefForParticipation(
  entityType: CommunityParticipationEntityType,
  entityId: string,
): string {
  const id = encodeURIComponent(entityId.trim());
  switch (entityType) {
    case "experience":
      return `/experiences/${id}`;
    case "event":
      return `/community`;
    case "group":
      return `/community/groups/${id}`;
    case "help":
      return `/services/work/${id}`;
  }
}

export function buildParticipationActions(input: {
  entityType: CommunityParticipationEntityType;
  entityId: string;
  viewerStatus: CommunityParticipationViewerStatus;
  canJoin: boolean;
  canInvite: boolean;
  canConverse: boolean;
}): CommunityParticipationAction[] {
  const href = conversationHrefForParticipation(
    input.entityType,
    input.entityId,
  );
  if (input.entityType === "help") {
    return [
      {
        kind: "respond",
        label: "Responder",
        href,
        enabled: input.canConverse || input.canJoin,
      },
    ];
  }
  const joined =
    input.viewerStatus === "joined" || input.viewerStatus === "pending";
  const actions: CommunityParticipationAction[] = [
    {
      kind: "join",
      label:
        input.viewerStatus === "invited"
          ? "Aceptar invitación"
          : input.viewerStatus === "pending"
            ? "En lista de espera"
            : joined
              ? "Ya participas"
              : "Unirme",
      enabled: input.canJoin && !joined,
    },
    {
      kind: "invite",
      label: "Invitar",
      enabled: input.canInvite && joined,
    },
    {
      kind: "converse",
      label: "Conversación",
      href,
      enabled: input.canConverse && joined,
    },
  ];
  return actions;
}

export function createParticipationContext(input: {
  tenantId: string;
  territoryId: string;
  entityType: CommunityParticipationEntityType;
  entityId: string;
  rows: readonly CommunityParticipationRow[];
  viewerPersonId?: string | null;
  canJoin?: boolean;
  canInvite?: boolean;
  canConverse?: boolean;
}): CommunityParticipationContext {
  const entityId = input.entityId.trim();
  const viewerRow = input.viewerPersonId
    ? input.rows.find((row) => row.personId === input.viewerPersonId)
    : undefined;
  const viewerStatus = viewerStatusFromRole(viewerRow?.role);
  return {
    id: participationContextId(input.entityType, entityId),
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    entityType: input.entityType,
    entityId,
    participants: aggregateParticipantRoles(input.rows),
    viewerParticipation: {
      status: viewerStatus,
      ...(viewerRow?.role ? { role: viewerRow.role } : {}),
    },
    actions: buildParticipationActions({
      entityType: input.entityType,
      entityId,
      viewerStatus,
      canJoin: input.canJoin ?? false,
      canInvite: input.canInvite ?? false,
      canConverse: input.canConverse ?? false,
    }),
  };
}

export function visibleParticipantIds(
  rows: readonly CommunityParticipationRow[],
  privacyByPerson: ReadonlyMap<string, CommunityParticipationPrivacy>,
): string[] {
  return rows
    .filter((row) => {
      const privacy =
        privacyByPerson.get(row.personId) ??
        DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY;
      return privacy.appearInParticipants;
    })
    .map((row) => row.personId);
}

export function aggregatedSocialLabel(count: number): string | undefined {
  if (count <= 0) return undefined;
  return count === 1
    ? "1 persona participando"
    : `${count} personas participando`;
}

export function mergeParticipationPrivacy(
  value?: Partial<CommunityParticipationPrivacy> | null,
): CommunityParticipationPrivacy {
  return {
    appearInParticipants:
      value?.appearInParticipants ??
      DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY.appearInParticipants,
    receiveInvitations:
      value?.receiveInvitations ??
      DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY.receiveInvitations,
    showActivity:
      value?.showActivity ?? DEFAULT_COMMUNITY_PARTICIPATION_PRIVACY.showActivity,
  };
}

/** Forbidden parallel social-network types — never introduce these. */
export const FORBIDDEN_SOCIAL_NETWORK_TYPES = [
  "SocialPostEntity",
  "UserActivityEntity",
  "FriendEntity",
  "FollowerEntity",
  "InvitationEntity",
] as const;
