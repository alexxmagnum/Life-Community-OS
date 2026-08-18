import {
  applyTenantConfigurationPreset,
  tenantPackToTenantConfiguration,
  type TenantConfiguration,
} from "@life-community-os/types";
import { lifeValleyFeatures } from "./features";
import { lifeValleyTheme } from "./theme";

export const LIFE_VALLEY_TENANT_ID = "life-valley";
export const LIFE_VALLEY_TERRITORY_ID = "terr-life-valley";

export function resolveLifeValleyTenantConfiguration(): TenantConfiguration {
  const fromFlags = tenantPackToTenantConfiguration({
    tenantId: LIFE_VALLEY_TENANT_ID,
    branding: {
      name: lifeValleyTheme.name,
      shortName: lifeValleyTheme.shortName,
    },
    territory: {
      territoryId: LIFE_VALLEY_TERRITORY_ID,
      territoryName: lifeValleyTheme.identity?.territoryName,
      defaultAreaName: lifeValleyTheme.identity?.defaultAreaName,
    },
    languages: ["es"],
    features: { ...lifeValleyFeatures },
  });
  return applyTenantConfigurationPreset(fromFlags, "full_product");
}
