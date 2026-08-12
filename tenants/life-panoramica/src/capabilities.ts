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
  /** Housing / Living (platform module — availability gated separately). */
  housingView: "housing.view",
  housingCreateOwnListing: "housing.create_own_listing",
  housingEditOwnListing: "housing.edit_own_listing",
  /** Authorized agency / promoter (tenant-granted). */
  housingPublisher: "housing.publisher",
  housingContact: "housing.contact",
  housingSave: "housing.save",
  /** Administer Housing module settings / moderation. */
  housingManage: "housing.manage",
  /**
   * Life Map — spatial twin (availability gated by module enablement).
   */
  lifeMapView: "lifeMap.view",
  lifeMapInteract: "lifeMap.interact",
  lifeMapManage: "lifeMap.manage",
  channelView: "community.channel.view",
  channelCreate: "community.channel.create",
  channelPublish: "community.channel.publish",
  residencyClaim: "community.residency.claim",
  residencyVerifyReview: "community.residency.verify_review",
  manageEnter: "community.manage.enter",
  /**
   * Security module actions — visibility is TenantConfiguration / module enablement.
   * Publishing notices requires a dedicated create capability when introduced.
   */
  securityView: "community.security.view",
  securityNoticesView: "community.security.notices.view",
  securityGateView: "community.security.gate.view",
  securityPatrolView: "community.security.patrol.view",
  securityIncidentCreate: "community.security.incident.create",
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
  CAPABILITIES.housingView,
  CAPABILITIES.housingCreateOwnListing,
  CAPABILITIES.housingEditOwnListing,
  CAPABILITIES.housingContact,
  CAPABILITIES.housingSave,
  /** Ready when `lifeMap` feature flag is enabled — no UI yet. */
  CAPABILITIES.lifeMapView,
  CAPABILITIES.lifeMapInteract,
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
    /** Demo stand-in for a tenant-authorized professional publisher. */
    CAPABILITIES.housingPublisher,
  ],
  moderator: [
    ...memberCaps,
    CAPABILITIES.manageEnter,
    CAPABILITIES.residencyVerifyReview,
    CAPABILITIES.housingManage,
    CAPABILITIES.lifeMapManage,
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
    CAPABILITIES.housingManage,
    CAPABILITIES.lifeMapManage,
    // Ready when `securityModule` feature flag is enabled — no UI yet.
    CAPABILITIES.securityView,
    CAPABILITIES.securityNoticesView,
    CAPABILITIES.securityGateView,
    CAPABILITIES.securityPatrolView,
    CAPABILITIES.securityIncidentCreate,
  ],
};

/**
 * Module visibility helpers — feature flag + capability.
 * Navigation must use these; never show modules that are off or unauthorized.
 */
export function canAccessSecurityModule(input: {
  featureEnabled: boolean;
  hasCapability: (key: CapabilityKey | string) => boolean;
}): boolean {
  return (
    input.featureEnabled && input.hasCapability(CAPABILITIES.securityView)
  );
}

export function canAccessMunicipalityModule(input: {
  featureEnabled: boolean;
}): boolean {
  return input.featureEnabled;
}

/** Housing module visibility — feature/module flag + view capability. */
export function canAccessHousingModule(input: {
  featureEnabled: boolean;
  hasCapability: (key: CapabilityKey | string) => boolean;
}): boolean {
  return (
    input.featureEnabled && input.hasCapability(CAPABILITIES.housingView)
  );
}

/** Life Map visibility — feature/module flag + view capability (fail closed). */
export function canAccessLifeMapModule(input: {
  featureEnabled: boolean;
  hasCapability: (key: CapabilityKey | string) => boolean;
}): boolean {
  return (
    input.featureEnabled && input.hasCapability(CAPABILITIES.lifeMapView)
  );
}

export function capabilitiesForRole(role: DemoRole): Set<CapabilityKey> {
  return new Set(roleCapabilities[role]);
}
