/**
 * Feature availability for this tenant (ADR-023 readiness).
 * UI hides entry points when false — not a permission system.
 */
export type TenantFeatureFlags = {
  experiences: boolean;
  services: boolean;
  resources: boolean;
  recommendations: boolean;
  groups: boolean;
  decide: boolean;
  interactions: boolean;
  incidents: boolean;
  feed: boolean;
  calendar: boolean;
};

export const lifePanoramicaFeatures: TenantFeatureFlags = {
  experiences: true,
  services: true,
  resources: true,
  recommendations: true,
  groups: true,
  decide: true,
  interactions: true,
  incidents: true,
  feed: true,
  calendar: true,
};
