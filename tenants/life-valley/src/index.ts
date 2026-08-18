/**
 * Life Valley — minimal second tenant pack for multi-tenant validation.
 * Capability vocabulary reused from platform reference (same AuthZ keys).
 */

export { lifeValleyTheme } from "./theme";
export { lifeValleyFeatures } from "./features";
export {
  resolveLifeValleyTenantConfiguration,
  LIFE_VALLEY_TENANT_ID,
  LIFE_VALLEY_TERRITORY_ID,
} from "./tenant-configuration";

export {
  CAPABILITIES,
  capabilitiesForRole,
  type CapabilityKey,
  type DemoRole,
} from "@life-community-os/tenant-life-panoramica";

export const tenantId = "life-valley" as const;
