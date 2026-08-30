/**
 * Platform capability vocabulary — re-exported from contracts.
 * Tenant packs never own this list.
 */

export {
  CAPABILITIES,
  capabilitiesForRole,
  canAccessSecurityModule,
  canAccessMunicipalityModule,
  canAccessHousingModule,
  canAccessLifeMapModule,
} from "@life-community-os/types";

export type {
  CapabilityKey,
  TenantFeatureFlags,
} from "@life-community-os/types";
