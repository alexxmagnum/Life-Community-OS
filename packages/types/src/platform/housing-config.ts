/**
 * Housing module settings on TenantConfiguration (platform runtime).
 * Domain contracts live in domain/housing — this file only resolves/merges.
 */

import type {
  HousingListingType,
  HousingPublishingConfig,
  HousingTenantModuleConfig,
} from "../domain/housing";
import {
  HOUSING_LISTING_TYPES,
  HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
} from "../domain/housing";
import type { TenantConfiguration } from "./tenant-configuration";
import { isTenantModuleEnabled } from "./tenant-configuration";

const HOUSING_MODULE_ID = "housing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseListingTypes(value: unknown): readonly HousingListingType[] {
  if (!Array.isArray(value)) {
    return HOUSING_TENANT_MODULE_CONFIG_DEFAULTS.enabledCategories;
  }
  const allowed = new Set<string>(HOUSING_LISTING_TYPES);
  const next = value.filter(
    (item): item is HousingListingType =>
      typeof item === "string" && allowed.has(item),
  );
  return next.length > 0
    ? next
    : HOUSING_TENANT_MODULE_CONFIG_DEFAULTS.enabledCategories;
}

function parsePublishing(value: unknown): HousingPublishingConfig {
  const defaults = HOUSING_TENANT_MODULE_CONFIG_DEFAULTS.publishing;
  if (!isRecord(value)) return { ...defaults };
  return {
    residentsEnabled:
      typeof value.residentsEnabled === "boolean"
        ? value.residentsEnabled
        : defaults.residentsEnabled,
    professionalsEnabled:
      typeof value.professionalsEnabled === "boolean"
        ? value.professionalsEnabled
        : defaults.professionalsEnabled,
    moderationRequired:
      typeof value.moderationRequired === "boolean"
        ? value.moderationRequired
        : defaults.moderationRequired,
  };
}

function parseZones(
  value: unknown,
): HousingTenantModuleConfig["zones"] {
  if (!Array.isArray(value)) {
    return HOUSING_TENANT_MODULE_CONFIG_DEFAULTS.zones;
  }
  const zones: { key: string; label: string }[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (typeof item.key !== "string" || typeof item.label !== "string") continue;
    const key = item.key.trim();
    const label = item.label.trim();
    if (!key || !label) continue;
    zones.push({ key, label });
  }
  return zones;
}

/**
 * Merge raw module config (from TenantConfiguration / pack) with platform defaults.
 * Tenant-neutral — no Life Panoramica catalogs.
 */
export function mergeHousingTenantModuleConfig(
  raw?: Readonly<Record<string, unknown>> | null,
): HousingTenantModuleConfig {
  if (!raw) {
    return {
      ...HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
      publishing: { ...HOUSING_TENANT_MODULE_CONFIG_DEFAULTS.publishing },
    };
  }

  const defaults = HOUSING_TENANT_MODULE_CONFIG_DEFAULTS;
  return {
    enabledCategories: parseListingTypes(raw.enabledCategories),
    publishing: parsePublishing(raw.publishing),
    defaultCurrency:
      typeof raw.defaultCurrency === "string" && raw.defaultCurrency.trim()
        ? raw.defaultCurrency.trim()
        : defaults.defaultCurrency,
    copy: isRecord(raw.copy)
      ? (raw.copy as HousingTenantModuleConfig["copy"])
      : defaults.copy,
    zones: parseZones(raw.zones),
  };
}

/** Serialize Housing settings for TenantModuleEnablement.config / pack moduleConfigs. */
export function housingTenantModuleConfigToRecord(
  config: HousingTenantModuleConfig = HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
): Record<string, unknown> {
  return {
    enabledCategories: [...config.enabledCategories],
    publishing: { ...config.publishing },
    defaultCurrency: config.defaultCurrency,
    copy: config.copy ? { ...config.copy } : undefined,
    zones: config.zones ? config.zones.map((z) => ({ ...z })) : undefined,
  };
}

/**
 * Resolve Housing module knobs from TenantConfiguration.
 * Always returns a complete config (defaults fill gaps).
 */
export function resolveHousingTenantModuleConfig(
  configuration: TenantConfiguration,
): HousingTenantModuleConfig {
  const entry = configuration.modules[HOUSING_MODULE_ID];
  return mergeHousingTenantModuleConfig(entry?.config ?? null);
}

/** Housing availability — feature/module enablement only (not AuthZ). */
export function isHousingEnabledInTenantConfiguration(
  configuration: TenantConfiguration,
): boolean {
  return isTenantModuleEnabled(configuration, HOUSING_MODULE_ID);
}

/**
 * Apply / replace Housing settings on a TenantConfiguration (immutable).
 * Does not change enabled flag unless `enabled` is provided.
 */
export function withHousingTenantModuleConfig(
  configuration: TenantConfiguration,
  config: HousingTenantModuleConfig,
  enabled?: boolean,
): TenantConfiguration {
  const existing = configuration.modules[HOUSING_MODULE_ID];
  return {
    ...configuration,
    modules: {
      ...configuration.modules,
      [HOUSING_MODULE_ID]: {
        enabled: enabled ?? existing?.enabled ?? false,
        submodules: existing?.submodules,
        config: housingTenantModuleConfigToRecord(config),
      },
    },
  };
}
