/**
 * Capability keys aligned with product mapping (doc 07).
 * Foundation stub — real AuthZ remains Platform RBAC (ADR-012).
 * UI must call hasCapability(); never invent grants inside components.
 */
export const CAPABILITIES = {
  experienceCreate: "community.experience.create",
  experienceJoin: "community.experience.join",
  contentPostCreate: "community.content.post.create",
  proposalCreate: "community.proposal.create",
  incidentCreate: "incidents.request.create",
  reservationCreate: "community.reservation.create",
  recommendationCreate: "community.recommendation.create",
  announcementPublishOfficial: "community.announcement.publish_official",
  groupCreate: "community.group.create",
  manageEnter: "community.manage.enter",
} as const;

export type CapabilityKey = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

/** Demo role for foundation UI — replace with RBAC evaluation later. */
export type DemoRole =
  | "member"
  | "group_manager"
  | "moderator"
  | "administrator";

const memberCaps: CapabilityKey[] = [
  CAPABILITIES.experienceJoin,
  CAPABILITIES.contentPostCreate,
  CAPABILITIES.incidentCreate,
  CAPABILITIES.reservationCreate,
  CAPABILITIES.recommendationCreate,
  CAPABILITIES.experienceCreate,
  CAPABILITIES.proposalCreate,
  CAPABILITIES.groupCreate,
];

const roleCapabilities: Record<DemoRole, CapabilityKey[]> = {
  member: memberCaps,
  group_manager: [...memberCaps, CAPABILITIES.manageEnter],
  moderator: [...memberCaps, CAPABILITIES.manageEnter],
  administrator: [
    ...memberCaps,
    CAPABILITIES.announcementPublishOfficial,
    CAPABILITIES.manageEnter,
  ],
};

export function capabilitiesForRole(role: DemoRole): Set<CapabilityKey> {
  return new Set(roleCapabilities[role]);
}
