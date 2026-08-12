/**
 * Life Panoramica → TenantConfiguration adapter (Phase D.0.2).
 *
 * Does not replace theme / features / capabilities packs.
 * Reference demo defaults to FULL PRODUCT MODE (core modules on;
 * optional modules with defaultEnabled false remain flag-driven / fail closed).
 */

import {
  applyTenantConfigurationPreset,
  resolveTenantConfiguration,
  tenantPackToTenantConfiguration,
  type TenantConfiguration,
  type TenantConfigurationPreset,
  type TenantPackConfigurationSource,
} from "@life-community-os/types";

import { DEMO_TENANT_ID, DEMO_TERRITORY_ID } from "./demo-ids";
import {
  lifePanoramicaFeatures,
  lifePanoramicaFeaturesMinimal,
} from "./features";
import { lifePanoramicaTheme } from "./theme";

/** Pack surface for the platform adapter — keep packs as source of truth. */
export function getLifePanoramicaPackConfigurationSource(
  preset: TenantConfigurationPreset = "full_product",
): TenantPackConfigurationSource {
  const features =
    preset === "minimal_community"
      ? lifePanoramicaFeaturesMinimal
      : lifePanoramicaFeatures;

  return {
    tenantId: DEMO_TENANT_ID,
    branding: {
      name: lifePanoramicaTheme.name,
      shortName: lifePanoramicaTheme.shortName,
      logo: lifePanoramicaTheme.imagery.logo,
    },
    territory: {
      territoryId: DEMO_TERRITORY_ID,
      territoryName: lifePanoramicaTheme.identity?.territoryName,
      defaultAreaName: lifePanoramicaTheme.identity?.defaultAreaName,
    },
    languages: ["es"],
    features: { ...features },
  };
}

/** Adapter: current tenant pack → TenantConfiguration. */
export function lifePanoramicaTenantConfiguration(
  preset: TenantConfigurationPreset = "full_product",
): TenantConfiguration {
  const fromFlags = tenantPackToTenantConfiguration(
    getLifePanoramicaPackConfigurationSource(preset),
  );
  // Ensure preset visibility is explicit (full product turns core modules ON;
  // optional defaultEnabled:false modules stay at feature-flag state).
  return applyTenantConfigurationPreset(fromFlags, preset);
}

/**
 * Resolve configuration for this tenant.
 * D.0.2 source = tenant pack (full product showcase). Future: runtime configuration.
 */
export function resolveLifePanoramicaTenantConfiguration(
  preset: TenantConfigurationPreset = "full_product",
): TenantConfiguration {
  return lifePanoramicaTenantConfiguration(preset);
}

/** Explicit resolve via platform source union (pack today / runtime later). */
export function resolveLifePanoramicaTenantConfigurationFromSource(
  preset: TenantConfigurationPreset = "full_product",
): TenantConfiguration {
  return resolveTenantConfiguration({
    kind: "tenant_pack",
    pack: getLifePanoramicaPackConfigurationSource(preset),
  });
}
