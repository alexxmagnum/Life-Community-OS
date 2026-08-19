import {
  applyTenantConfigurationPreset,
  tenantPackToTenantConfiguration,
  type TenantConfiguration,
} from "@life-community-os/types";
import { oceanHillsFeatures } from "./features";
import { oceanHillsTheme } from "./theme";

export const OCEAN_HILLS_TENANT_ID = "life-ocean-hills";
export const OCEAN_HILLS_TERRITORY_ID = "terr-life-ocean-hills";

export function resolveOceanHillsTenantConfiguration(): TenantConfiguration {
  const fromFlags = tenantPackToTenantConfiguration({
    tenantId: OCEAN_HILLS_TENANT_ID,
    branding: {
      name: oceanHillsTheme.name,
      shortName: oceanHillsTheme.shortName,
    },
    territory: {
      territoryId: OCEAN_HILLS_TERRITORY_ID,
      territoryName: oceanHillsTheme.identity?.territoryName,
      defaultAreaName: oceanHillsTheme.identity?.defaultAreaName,
    },
    languages: ["en"],
    features: { ...oceanHillsFeatures },
  });
  return applyTenantConfigurationPreset(fromFlags, "minimal_community");
}
