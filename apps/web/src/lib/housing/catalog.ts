/**
 * Housing tenant module config — no runtime catalog seed.
 * Property records come from /api/housing.
 */

import type {
  HousingTenantModuleConfig,
  TenantConfiguration,
} from "@life-community-os/types";
import {
  HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
  resolveHousingTenantModuleConfig,
} from "@life-community-os/types";

/**
 * Resolve Housing knobs from TenantConfiguration (runtime).
 * Falls back to platform defaults when configuration is omitted.
 */
export function getHousingModuleConfig(
  configuration?: TenantConfiguration,
): HousingTenantModuleConfig {
  if (configuration) {
    return resolveHousingTenantModuleConfig(configuration);
  }
  return {
    ...HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
    publishing: { ...HOUSING_TENANT_MODULE_CONFIG_DEFAULTS.publishing },
  };
}
