/**
 * Capability keys — Community Communication Foundation stub (ADR-012).
 * Real AuthZ remains Platform RBAC; this maps demo roles → capability strings.
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
  /** Territorial resource inventory — Authority / admin only. */
  resourceCreateTerritorial: "community.resource.create_territorial",
  /** Alias used by earlier Create Sheet wiring */
  reservationCreate: "community.resource.reserve",
  proposalCreate: "community.proposal.create",
  incidentCreate: "incidents.request.create",
  recommendationCreate: "community.recommendation.create",
  /** Local Entity discovery — view local life ecosystem (ADR-017 / ADR-032). */
  localView: "community.local.view",
  /** View aggregated community life pulse. */
  pulseView: "community.pulse.view",
  announcementPublishOfficial: "community.announcement.publish_official",
  groupCreate: "community.group.create",
  marketplaceView: "community.marketplace.view",
  marketplaceCreate: "community.marketplace.create",
  channelView: "community.channel.view",
  channelCreate: "community.channel.create",
  channelPublish: "community.channel.publish",
  residencyClaim: "community.residency.claim",
  residencyVerifyReview: "community.residency.verify_review",
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
  /** Residents create community moments (not admin-only). */
  CAPABILITIES.experienceCreate,
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
  CAPABILITIES.pulseView,
  CAPABILITIES.proposalCreate,
  CAPABILITIES.groupCreate,
  CAPABILITIES.marketplaceView,
  CAPABILITIES.marketplaceCreate,
  CAPABILITIES.channelView,
  CAPABILITIES.residencyClaim,
];

const roleCapabilities: Record<DemoRole, CapabilityKey[]> = {
  member: memberCaps,
  group_manager: [
    ...memberCaps,
    CAPABILITIES.experienceCreate,
    CAPABILITIES.experienceManage,
    CAPABILITIES.resourceManage,
    CAPABILITIES.channelPublish,
    CAPABILITIES.manageEnter,
  ],
  moderator: [
    ...memberCaps,
    CAPABILITIES.manageEnter,
    CAPABILITIES.residencyVerifyReview,
  ],
  administrator: [
    ...memberCaps,
    CAPABILITIES.experienceCreate,
    CAPABILITIES.experienceManage,
    CAPABILITIES.resourceManage,
    CAPABILITIES.resourceCreateTerritorial,
    CAPABILITIES.announcementPublishOfficial,
    CAPABILITIES.channelCreate,
    CAPABILITIES.channelPublish,
    CAPABILITIES.residencyVerifyReview,
    CAPABILITIES.manageEnter,
  ],
};

export function capabilitiesForRole(role: DemoRole): Set<CapabilityKey> {
  return new Set(roleCapabilities[role]);
}
