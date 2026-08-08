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
export * from "./navigation-projector";
export * from "./community-areas";
export * from "./official-entities";
export * from "./channels";
export * from "./channel-access";
export * from "./residency-demo";
export * from "./content";
export * from "./experiences";
export * from "./community-content";
export * from "./resources";
export * from "./marketplace";
export * from "./groups";
export * from "./local-places";
export * from "./community-pulse";
export * from "./home-feed";
export * from "./home-search";
export * from "./explorer-nav";
export * from "./service-near-hubs";
export * from "./home-front-door";
export {
  CAPABILITIES,
  canAccessMunicipalityModule,
  canAccessSecurityModule,
  capabilitiesForRole,
  type CapabilityKey,
  type DemoRole,
} from "./capabilities";

export const tenantId = "life-panoramica" as const;
