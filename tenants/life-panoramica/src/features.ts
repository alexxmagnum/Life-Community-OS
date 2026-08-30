/**
 * Feature availability for this tenant (ADR-023 readiness).
 * UI hides entry points when false — not a permission system.
 *
 * Values are tenant configuration. The flag shape lives on the platform.
 */

import type { TenantFeatureFlags } from "@life-community-os/types";

export type { TenantFeatureFlags } from "@life-community-os/types";

/**
 * Life Panoramica reference demo — FULL PRODUCT MODE.
 * Build everything → verify experience → configure visibility later.
 * Flags remain the customization/rollout mechanism for other tenants.
 */
export const lifePanoramicaFeatures: TenantFeatureFlags = {
  experiences: true,
  activities: true,
  services: true,
  work: true,
  resources: true,
  recommendations: true,
  localLife: true,
  localEntities: true,
  communityPulse: true,
  groups: true,
  decide: true,
  interactions: true,
  incidents: true,
  feed: true,
  calendar: true,
  marketplace: true,
  communityChannels: true,
  officialChannels: true,
  municipalServices: true,
  securityModule: true,
  mobility: true,
  residencyVerification: true,
  participationTrust: true,
  intelligentDiffusion: true,
  housing: true,
  /**
   * Life Map — spatial digital twin (premium).
   * Reference demo: ON — customer-ready community experience.
   */
  lifeMap: true,
};

/** Minimal community showcase — core living modules only (future tenants). */
export const lifePanoramicaFeaturesMinimal: TenantFeatureFlags = {
  ...lifePanoramicaFeatures,
  municipalServices: false,
  securityModule: false,
  marketplace: false,
  mobility: false,
  recommendations: false,
  work: false,
  housing: false,
  lifeMap: false,
};
