/**
 * Ocean Hills Community — independent white-label pack.
 * Capability vocabulary is platform-shared; content and brand are original.
 */

export { oceanHillsTheme } from "./theme";
export { oceanHillsFeatures } from "./features";
export {
  resolveOceanHillsTenantConfiguration,
  OCEAN_HILLS_TENANT_ID,
  OCEAN_HILLS_TERRITORY_ID,
} from "./tenant-configuration";
export {
  oceanHillsCatalogSeed,
  oceanHillsLocationSeeds,
  oceanHillsExperienceCatalog,
} from "./catalogs";

export {
  CAPABILITIES,
  capabilitiesForRole,
} from "@life-community-os/types";
export type {
  CapabilityKey,
  DemoRole,
} from "@life-community-os/types";

export const tenantId = "life-ocean-hills" as const;
