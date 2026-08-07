export { lifePanoramicaTheme } from "./theme";
export {
  lifePanoramicaFeatures,
  type TenantFeatureFlags,
} from "./features";
export * from "./content";
export * from "./experiences";
export {
  CAPABILITIES,
  capabilitiesForRole,
  type CapabilityKey,
  type DemoRole,
} from "./capabilities";

export const tenantId = "life-panoramica" as const;
