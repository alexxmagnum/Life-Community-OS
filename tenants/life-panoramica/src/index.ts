/**
 * Life Panoramica tenant pack exports.
 * Demo catalogs for Community Communication Foundation (ADR-035–038).
 * No migrations in this slice.
 */

export { lifePanoramicaTheme } from "./theme";
export {
  lifePanoramicaFeatures,
  type TenantFeatureFlags,
} from "./features";
export * from "./demo-ids";
export * from "./demo-members";
export * from "./person-id-alignment";
export * from "./contribution";
export * from "./tenant-configuration";
export * from "./housing";
export * from "./housing-operations";
export * from "./life-map";
export * from "./life-map-content";
export * from "./life-map-context";
export * from "./life-map-territory-data";
export * from "./life-map-territory-resolver";
export * from "./life-map-territory-objects";
export * from "./navigation-projector";
export * from "./community-areas";
export * from "./official-entities";
export * from "./official-conversations";
export * from "./channels";
export * from "./channel-access";
export * from "./residency-demo";
export * from "./property-home-context";
export * from "./territory-access-context";
export * from "./territory-local-life";
export * from "./content";
export * from "./experiences";
export * from "./experience-conversations";
export * from "./community-content";
export * from "./resources";
export * from "./marketplace";
export * from "./marketplace-conversations";
export * from "./work-posts";
export * from "./work-conversations";
export * from "./groups";
export * from "./group-conversations";
export * from "./local-places";
export * from "./place-conversations";
export * from "./neighbour-conversations";
export * from "./community-pulse";
export * from "./community-alerts";
export * from "./home-feed";
export * from "./home-search";
export * from "./explorer-nav";
export * from "./community-hub";
export * from "./service-near-hubs";
export * from "./professional-trades";
export * from "./home-front-door";
export * from "./home-premium";
export {
  CAPABILITIES,
  canAccessMunicipalityModule,
  canAccessSecurityModule,
  canAccessHousingModule,
  canAccessLifeMapModule,
  capabilitiesForRole,
  type CapabilityKey,
  type DemoRole,
} from "./capabilities";

export const tenantId = "life-panoramica" as const;
