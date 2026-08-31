/**
 * Community Governance — territorial care, not a content domain.
 * Content stays in Experience / Community / Help / Marketplace / Business.
 * Do not create a universal content type, global bans, or karma.
 */

import type { MembershipRole } from "../platform/membership-role";
import type { CommunityFeedItem } from "../community/community-feed";

export const GOVERNANCE_REPORT_ENTITY_TYPES = [
  "experience",
  "event",
  "message",
  "business",
  "help",
  "listing",
] as const;

export type GovernanceReportEntityType =
  (typeof GOVERNANCE_REPORT_ENTITY_TYPES)[number];

export const GOVERNANCE_REPORT_REASONS = [
  "spam",
  "inappropriate",
  "safety",
  "other",
] as const;

export type GovernanceReportReason =
  (typeof GOVERNANCE_REPORT_REASONS)[number];

export const GOVERNANCE_REPORT_STATUSES = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

export type GovernanceReportStatus =
  (typeof GOVERNANCE_REPORT_STATUSES)[number];

export const GOVERNANCE_SAFETY_ACTION_TYPES = [
  "warning",
  "hide",
  "restrict",
  "block",
] as const;

export type GovernanceSafetyActionType =
  (typeof GOVERNANCE_SAFETY_ACTION_TYPES)[number];

export type CommunityRule = {
  id: string;
  tenantId: string;
  territoryId: string;
  title: string;
  description: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
};

export type CommunityContentReport = {
  id: string;
  tenantId: string;
  territoryId: string;
  entityType: GovernanceReportEntityType;
  entityId: string;
  reason: GovernanceReportReason;
  status: GovernanceReportStatus;
  reporterPersonId: string;
  subjectPersonId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedBy?: string;
};

export type PublicGovernanceReport = Omit<
  CommunityContentReport,
  "reporterPersonId"
> & {
  reporterProtected: true;
};

export type GovernanceSafetyAction = {
  id: string;
  tenantId: string;
  territoryId: string;
  type: GovernanceSafetyActionType;
  entityType?: GovernanceReportEntityType;
  entityId?: string;
  targetPersonId?: string;
  reportId?: string;
  actorPersonId: string;
  reason?: string;
  createdAt: string;
};

export type GovernancePersonBlock = {
  id: string;
  tenantId: string;
  territoryId: string;
  personId: string;
  blockedPersonId: string;
  createdAt: string;
};

export type CommunityGovernanceRoles = {
  administrator: boolean;
  moderator: boolean;
  groupManager: boolean;
};

export type CommunityGovernancePermissions = {
  reviewReports: boolean;
  manageCommunity: boolean;
  manageLocalRules: boolean;
};

export type CommunityGovernanceContext = {
  tenantId: string;
  territoryId: string;
  roles: CommunityGovernanceRoles;
  permissions: CommunityGovernancePermissions;
  rules: CommunityRule[];
};

export const TERRITORY_GOVERNANCE_ROLE_NAMES = [
  "TerritoryAdministrator",
  "TerritoryModerator",
  "GroupManager",
] as const;

export type TerritoryGovernanceRoleName =
  (typeof TERRITORY_GOVERNANCE_ROLE_NAMES)[number];

export const TRUST_REVIEW_REPORT_THRESHOLD = 2;

export function isGovernanceReportEntityType(
  value: string,
): value is GovernanceReportEntityType {
  return (GOVERNANCE_REPORT_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isGovernanceReportReason(
  value: string,
): value is GovernanceReportReason {
  return (GOVERNANCE_REPORT_REASONS as readonly string[]).includes(value);
}

export function isGovernanceReportStatus(
  value: string,
): value is GovernanceReportStatus {
  return (GOVERNANCE_REPORT_STATUSES as readonly string[]).includes(value);
}

export function isGovernanceSafetyActionType(
  value: string,
): value is GovernanceSafetyActionType {
  return (GOVERNANCE_SAFETY_ACTION_TYPES as readonly string[]).includes(value);
}

export function territoryRolesFromMembership(
  role: MembershipRole | null | undefined,
): CommunityGovernanceRoles {
  const administrator = role === "administrator";
  const moderator = role === "moderator" || administrator;
  const groupManager =
    role === "group_manager" || role === "moderator" || administrator;
  return { administrator, moderator, groupManager };
}

export function governancePermissionsFromRoles(
  roles: CommunityGovernanceRoles,
): CommunityGovernancePermissions {
  return {
    reviewReports: roles.moderator,
    manageCommunity: roles.moderator,
    manageLocalRules: roles.administrator,
  };
}

export function emptyGovernanceContext(input: {
  tenantId: string;
  territoryId: string;
  role?: MembershipRole | null;
  rules?: CommunityRule[];
}): CommunityGovernanceContext {
  const roles = territoryRolesFromMembership(input.role ?? null);
  return {
    tenantId: input.tenantId.trim(),
    territoryId: input.territoryId.trim(),
    roles,
    permissions: governancePermissionsFromRoles(roles),
    rules: (input.rules ?? []).filter(
      (rule) => rule.territoryId === input.territoryId.trim(),
    ),
  };
}

export function projectGovernanceContext(input: {
  tenantId: string;
  territoryId: string;
  role?: MembershipRole | null;
  rules?: CommunityRule[];
}): CommunityGovernanceContext {
  return emptyGovernanceContext(input);
}

export function redactReporter(
  report: CommunityContentReport,
): PublicGovernanceReport {
  const { reporterPersonId: _hidden, ...rest } = report;
  void _hidden;
  return { ...rest, reporterProtected: true };
}

export function ownReportView(
  report: CommunityContentReport,
  viewerPersonId: string,
): PublicGovernanceReport | CommunityContentReport | null {
  if (report.reporterPersonId !== viewerPersonId) return null;
  return report;
}

export function trustReviewRequired(input: {
  subjectPersonId: string;
  reports: readonly CommunityContentReport[];
  territoryId: string;
}): boolean {
  const open = input.reports.filter(
    (item) =>
      item.territoryId === input.territoryId &&
      item.subjectPersonId === input.subjectPersonId &&
      (item.status === "open" || item.status === "reviewing"),
  );
  return open.length >= TRUST_REVIEW_REPORT_THRESHOLD;
}

export function hiddenContentIdsFromActions(
  actions: readonly GovernanceSafetyAction[],
  territoryId: string,
): string[] {
  return actions
    .filter(
      (item) =>
        item.territoryId === territoryId &&
        item.type === "hide" &&
        Boolean(item.entityId),
    )
    .map((item) => item.entityId!)
    .filter(Boolean);
}

export function filterModeratedFeedItems(
  items: readonly CommunityFeedItem[],
  hiddenIds: readonly string[],
): CommunityFeedItem[] {
  if (hiddenIds.length === 0) return [...items];
  const hidden = new Set(hiddenIds);
  return items.filter((item) => {
    if (hidden.has(item.id)) return false;
    if (item.experienceId && hidden.has(item.experienceId)) return false;
    if (item.resourceId && hidden.has(item.resourceId)) return false;
    return true;
  });
}

export function isOpaqueGovernanceEntity(name: string): boolean {
  return (
    name === "UniversalContentEntity" ||
    name === "ReputationPenalty" ||
    name === "GlobalBan" ||
    name === "GlobalModerator" ||
    name === "PlatformModerator"
  );
}

export function hasGovernanceKarma(value: string): boolean {
  return /karma|puntos|ranking negativo|nivel\s*\d/i.test(value);
}
