/**
 * Platform authorization — role → capability matrix + tenant enablement.
 * Packs never define or grant permissions.
 */

import type { MembershipRole } from "./membership-role";
import type { ProductCapabilityMap } from "./tenant-contract";
import {
  CAPABILITIES,
  type CapabilityKey,
  type TenantFeatureFlags,
} from "./capabilities";

const memberCaps: CapabilityKey[] = [
  CAPABILITIES.experienceView,
  CAPABILITIES.experienceJoin,
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
  CAPABILITIES.lifeMapView,
  CAPABILITIES.lifeMapInteract,
  CAPABILITIES.channelView,
  CAPABILITIES.residencyClaim,
];

const ROLE_CAPABILITIES: Record<MembershipRole, readonly CapabilityKey[]> = {
  member: memberCaps,
  group_manager: [
    ...memberCaps,
    CAPABILITIES.experienceCreate,
    CAPABILITIES.experienceManage,
    CAPABILITIES.resourceManage,
    CAPABILITIES.channelPublish,
    CAPABILITIES.manageEnter,
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
    CAPABILITIES.securityView,
    CAPABILITIES.securityNoticesView,
    CAPABILITIES.securityGateView,
    CAPABILITIES.securityPatrolView,
    CAPABILITIES.securityIncidentCreate,
  ],
};

const CAPABILITY_FEATURE: Partial<Record<CapabilityKey, keyof TenantFeatureFlags>> =
  {
    [CAPABILITIES.marketplaceView]: "marketplace",
    [CAPABILITIES.marketplaceCreate]: "marketplace",
    [CAPABILITIES.housingView]: "housing",
    [CAPABILITIES.housingCreateOwnListing]: "housing",
    [CAPABILITIES.housingEditOwnListing]: "housing",
    [CAPABILITIES.housingPublisher]: "housing",
    [CAPABILITIES.housingContact]: "housing",
    [CAPABILITIES.housingSave]: "housing",
    [CAPABILITIES.housingManage]: "housing",
    [CAPABILITIES.lifeMapView]: "lifeMap",
    [CAPABILITIES.lifeMapInteract]: "lifeMap",
    [CAPABILITIES.lifeMapManage]: "lifeMap",
    [CAPABILITIES.resourceView]: "resources",
    [CAPABILITIES.resourceReserve]: "resources",
    [CAPABILITIES.resourceManage]: "resources",
    [CAPABILITIES.resourceCreateTerritorial]: "resources",
    [CAPABILITIES.experienceView]: "experiences",
    [CAPABILITIES.experienceCreate]: "experiences",
    [CAPABILITIES.experienceJoin]: "experiences",
    [CAPABILITIES.experienceManage]: "experiences",
    [CAPABILITIES.securityView]: "securityModule",
    [CAPABILITIES.securityNoticesView]: "securityModule",
    [CAPABILITIES.securityGateView]: "securityModule",
    [CAPABILITIES.securityPatrolView]: "securityModule",
    [CAPABILITIES.securityIncidentCreate]: "securityModule",
    [CAPABILITIES.incidentCreate]: "incidents",
    [CAPABILITIES.residencyClaim]: "residencyVerification",
    [CAPABILITIES.residencyVerifyReview]: "residencyVerification",
  };

const CAPABILITY_PRODUCT: Partial<
  Record<CapabilityKey, keyof ProductCapabilityMap>
> = {
  [CAPABILITIES.marketplaceView]: "marketplace",
  [CAPABILITIES.marketplaceCreate]: "marketplace",
  [CAPABILITIES.housingView]: "housing",
  [CAPABILITIES.housingCreateOwnListing]: "housing",
  [CAPABILITIES.housingEditOwnListing]: "housing",
  [CAPABILITIES.housingPublisher]: "housing",
  [CAPABILITIES.housingContact]: "housing",
  [CAPABILITIES.housingSave]: "housing",
  [CAPABILITIES.housingManage]: "housing",
  [CAPABILITIES.lifeMapView]: "lifeMap",
  [CAPABILITIES.lifeMapInteract]: "lifeMap",
  [CAPABILITIES.lifeMapManage]: "lifeMap",
  [CAPABILITIES.resourceView]: "resources",
  [CAPABILITIES.resourceReserve]: "resources",
  [CAPABILITIES.resourceManage]: "resources",
  [CAPABILITIES.resourceCreateTerritorial]: "resources",
  [CAPABILITIES.experienceView]: "experiences",
  [CAPABILITIES.experienceCreate]: "experiences",
  [CAPABILITIES.experienceJoin]: "experiences",
  [CAPABILITIES.experienceManage]: "experiences",
};

export function capabilitiesForRole(
  role: MembershipRole,
): Set<CapabilityKey> {
  return new Set(ROLE_CAPABILITIES[role]);
}

export function isCapabilityEnabledForTenant(
  capability: CapabilityKey | string,
  features?: TenantFeatureFlags,
  productCapabilities?: ProductCapabilityMap,
): boolean {
  const featureKey = CAPABILITY_FEATURE[capability as CapabilityKey];
  if (features && featureKey && features[featureKey] === false) {
    return false;
  }
  const productKey = CAPABILITY_PRODUCT[capability as CapabilityKey];
  if (
    productCapabilities &&
    productKey &&
    productCapabilities[productKey] === false
  ) {
    return false;
  }
  return true;
}

export type EffectivePermissionInput = {
  role: MembershipRole | null;
  features?: TenantFeatureFlags;
  productCapabilities?: ProductCapabilityMap;
};

/**
 * Session + membership role + tenant configuration → granted actions.
 * Enabling a tenant flag cannot grant capabilities the role does not have.
 */
export function resolveEffectivePermissions(
  input: EffectivePermissionInput,
): readonly string[] {
  if (!input.role) return [];
  return [...capabilitiesForRole(input.role)].filter((capability) =>
    isCapabilityEnabledForTenant(
      capability,
      input.features,
      input.productCapabilities,
    ),
  );
}

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

export function canAccessHousingModule(input: {
  featureEnabled: boolean;
  hasCapability: (key: CapabilityKey | string) => boolean;
}): boolean {
  return (
    input.featureEnabled && input.hasCapability(CAPABILITIES.housingView)
  );
}

export function canAccessLifeMapModule(input: {
  featureEnabled: boolean;
  hasCapability: (key: CapabilityKey | string) => boolean;
}): boolean {
  return (
    input.featureEnabled && input.hasCapability(CAPABILITIES.lifeMapView)
  );
}
