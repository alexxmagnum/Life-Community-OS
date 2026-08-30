/**
 * Platform capability keys — AuthZ action vocabulary.
 * Tenant packs may enable/disable modules. They never define this list.
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
  resourceView: "community.resource.view",
  resourceReserve: "community.resource.reserve",
  resourceManage: "community.resource.manage",
  resourceCreateTerritorial: "community.resource.create_territorial",
  reservationCreate: "community.resource.reserve",
  proposalCreate: "community.proposal.create",
  incidentCreate: "incidents.request.create",
  recommendationCreate: "community.recommendation.create",
  localView: "community.local.view",
  pulseView: "community.pulse.view",
  announcementPublishOfficial: "community.announcement.publish_official",
  groupCreate: "community.group.create",
  marketplaceView: "community.marketplace.view",
  marketplaceCreate: "community.marketplace.create",
  housingView: "housing.view",
  housingCreateOwnListing: "housing.create_own_listing",
  housingEditOwnListing: "housing.edit_own_listing",
  housingPublisher: "housing.publisher",
  housingContact: "housing.contact",
  housingSave: "housing.save",
  housingManage: "housing.manage",
  lifeMapView: "lifeMap.view",
  lifeMapInteract: "lifeMap.interact",
  lifeMapManage: "lifeMap.manage",
  channelView: "community.channel.view",
  channelCreate: "community.channel.create",
  channelPublish: "community.channel.publish",
  residencyClaim: "community.residency.claim",
  residencyVerifyReview: "community.residency.verify_review",
  manageEnter: "community.manage.enter",
  securityView: "community.security.view",
  securityNoticesView: "community.security.notices.view",
  securityGateView: "community.security.gate.view",
  securityPatrolView: "community.security.patrol.view",
  securityIncidentCreate: "community.security.incident.create",
} as const;

export type CapabilityKey = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

/**
 * Tenant module availability flags — configuration, not AuthZ.
 * Packs set values. Platform owns the shape.
 */
export type TenantFeatureFlags = {
  experiences: boolean;
  activities: boolean;
  services: boolean;
  work: boolean;
  resources: boolean;
  recommendations: boolean;
  localLife: boolean;
  localEntities: boolean;
  communityPulse: boolean;
  groups: boolean;
  decide: boolean;
  interactions: boolean;
  incidents: boolean;
  feed: boolean;
  calendar: boolean;
  marketplace: boolean;
  communityChannels: boolean;
  officialChannels: boolean;
  municipalServices: boolean;
  securityModule: boolean;
  mobility: boolean;
  residencyVerification: boolean;
  participationTrust: boolean;
  intelligentDiffusion: boolean;
  housing: boolean;
  lifeMap: boolean;
};
