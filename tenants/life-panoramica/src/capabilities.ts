/**
 * Capability keys — Experience, Community content, Resources (TECH-002–004).
 * Foundation stub — real AuthZ remains Platform RBAC (ADR-012).
 */
export const CAPABILITIES = {
  experienceView: "community.experience.view",
  experienceCreate: "community.experience.create",
  experienceJoin: "community.experience.join",
  experienceManage: "community.experience.manage",
  contentView: "community.content.view",
  contentCreate: "community.content.create",
  /** @deprecated Prefer contentCreate */
  contentPostCreate: "community.content.create",
  interactionComment: "community.interaction.comment",
  interactionReact: "community.interaction.react",
  interactionReport: "community.interaction.report",
  interactionSave: "community.interaction.save",
  /** ADR-031 / TECH-004 */
  resourceView: "community.resource.view",
  resourceReserve: "community.resource.reserve",
  resourceManage: "community.resource.manage",
  /** Alias used by earlier Create Sheet wiring */
  reservationCreate: "community.resource.reserve",
  proposalCreate: "community.proposal.create",
  incidentCreate: "incidents.request.create",
  recommendationCreate: "community.recommendation.create",
  /** Local Entity discovery — view local life ecosystem (ADR-017 / ADR-032). */
  localView: "community.local.view",
  announcementPublishOfficial: "community.announcement.publish_official",
  groupCreate: "community.group.create",
  marketplaceView: "community.marketplace.view",
  marketplaceCreate: "community.marketplace.create",
  manageEnter: "community.manage.enter",
} as const;

export type CapabilityKey = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export type DemoRole =
  | "member"
  | "group_manager"
  | "moderator"
  | "administrator";

const memberCaps: CapabilityKey[] = [
  CAPABILITIES.experienceView,
  CAPABILITIES.experienceJoin,
  CAPABILITIES.contentView,
  CAPABILITIES.contentCreate,
  CAPABILITIES.interactionComment,
  CAPABILITIES.interactionReact,
  CAPABILITIES.interactionReport,
  CAPABILITIES.interactionSave,
  CAPABILITIES.resourceView,
  CAPABILITIES.resourceReserve,
  CAPABILITIES.incidentCreate,
  CAPABILITIES.recommendationCreate,
  CAPABILITIES.localView,
  CAPABILITIES.proposalCreate,
  CAPABILITIES.groupCreate,
  CAPABILITIES.marketplaceView,
  CAPABILITIES.marketplaceCreate,
];

const roleCapabilities: Record<DemoRole, CapabilityKey[]> = {
  member: memberCaps,
  group_manager: [
    ...memberCaps,
    CAPABILITIES.experienceCreate,
    CAPABILITIES.experienceManage,
    CAPABILITIES.resourceManage,
    CAPABILITIES.manageEnter,
  ],
  moderator: [...memberCaps, CAPABILITIES.manageEnter],
  administrator: [
    ...memberCaps,
    CAPABILITIES.experienceCreate,
    CAPABILITIES.experienceManage,
    CAPABILITIES.resourceManage,
    CAPABILITIES.announcementPublishOfficial,
    CAPABILITIES.manageEnter,
  ],
};

export function capabilitiesForRole(role: DemoRole): Set<CapabilityKey> {
  return new Set(roleCapabilities[role]);
}
