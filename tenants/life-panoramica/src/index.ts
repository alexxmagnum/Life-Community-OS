export { lifePanoramicaTheme } from "./theme";
export {
  lifePanoramicaFeatures,
  type TenantFeatureFlags,
} from "./features";
export * from "./content";
export * from "./experiences";
export * from "./community-content";
export * from "./resources";
export * from "./marketplace";
export * from "./groups";
export * from "./local-places";
export * from "./community-pulse";
export * from "./home-feed";
export {
  CAPABILITIES,
  capabilitiesForRole,
  type CapabilityKey,
  type DemoRole,
} from "./capabilities";

export const tenantId = "life-panoramica" as const;
