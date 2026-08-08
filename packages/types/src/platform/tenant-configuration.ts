/**
 * Tenant Configuration (Phase D.0.2).
 *
 * Declarative availability config for a Tenant (ADR-014 / ADR-023).
 * Does not grant Permissions — Capabilities remain separate (ADR-012).
 *
 * Today: produced by Tenant Pack adapter.
 * Future: loaded from runtime configuration (no DB in D.0.2).
 */

import type { PlatformModule } from "./module-registry";
import {
  PLATFORM_MODULE_REGISTRY,
  listPlatformModules,
} from "./module-registry";

/** Branding slice referenced by Tenant Configuration (not full design tokens). */
export type TenantConfigurationBranding = {
  name: string;
  logo?: string;
  shortName?: string;
};

export type TenantConfigurationTerritory = {
  territoryId: string;
  territoryName?: string;
  defaultAreaName?: string;
};

/** Per-module enablement — availability only, never AuthZ. */
export type TenantModuleEnablement = {
  enabled: boolean;
  /** Child module id → enabled. */
  submodules?: Record<string, boolean>;
};

/**
 * Declarative tenant configuration spine.
 * Modules control availability; Capabilities control actions.
 */
export type TenantConfiguration = {
  tenantId: string;
  branding: TenantConfigurationBranding;
  territory?: TenantConfigurationTerritory;
  languages: readonly string[];
  modules: Record<string, TenantModuleEnablement>;
  /**
   * Provenance for debugging / future multi-source resolution.
   * Does not affect AuthZ.
   */
  source: "tenant_pack" | "runtime";
};

/**
 * Minimal pack surface required by the adapter.
 * Existing tenant packs map into this without being replaced.
 */
export type TenantPackConfigurationSource = {
  tenantId: string;
  branding: TenantConfigurationBranding;
  territory?: TenantConfigurationTerritory;
  languages?: readonly string[];
  /**
   * Feature flag bag (e.g. TenantFeatureFlags).
   * Keys align with PlatformModule.featureFlagKeys.
   */
  features: Readonly<Record<string, boolean>>;
};

export type TenantConfigurationSource =
  | { kind: "tenant_pack"; pack: TenantPackConfigurationSource }
  | { kind: "runtime"; configuration: TenantConfiguration };

/**
 * Resolve whether a module is enabled from its feature flags + registry default.
 * Empty featureFlagKeys → registry defaultEnabled.
 * Non-empty → enabled only when every listed flag is true in the pack.
 */
export function resolveModuleEnabledFromFeatures(
  module: PlatformModule,
  features: Readonly<Record<string, boolean>>,
): boolean {
  if (module.featureFlagKeys.length === 0) {
    return module.defaultEnabled;
  }
  return module.featureFlagKeys.every((key) => Boolean(features[key]));
}

function buildModuleEnablementTree(
  module: PlatformModule,
  features: Readonly<Record<string, boolean>>,
): TenantModuleEnablement {
  const enabled = resolveModuleEnabledFromFeatures(module, features);
  const children = module.submodules ?? [];
  if (children.length === 0) {
    return { enabled };
  }

  const submodules: Record<string, boolean> = {};
  for (const child of children) {
    // Child availability follows its own flags; parent OFF does not delete the row.
    const childEnabled = resolveModuleEnabledFromFeatures(child, features);
    submodules[child.id] = childEnabled;

    // Flatten deeper grandchildren into nested maps one level (sports → golf).
    if (child.submodules?.length) {
      for (const grand of child.submodules) {
        submodules[grand.id] = resolveModuleEnabledFromFeatures(grand, features);
      }
    }
  }

  return { enabled, submodules };
}

/**
 * Adapter: Tenant Pack surface → TenantConfiguration.
 * Does not mutate the pack. Does not merge Capabilities.
 */
export function tenantPackToTenantConfiguration(
  pack: TenantPackConfigurationSource,
  registry: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): TenantConfiguration {
  const modules: Record<string, TenantModuleEnablement> = {};

  for (const root of registry) {
    modules[root.id] = buildModuleEnablementTree(root, pack.features);
  }

  // Also index nested modules at top level for O(1) isModuleEnabled lookups.
  for (const module of listPlatformModules(registry)) {
    if (modules[module.id]) continue;
    modules[module.id] = {
      enabled: resolveModuleEnabledFromFeatures(module, pack.features),
    };
  }

  return {
    tenantId: pack.tenantId,
    branding: {
      name: pack.branding.name,
      logo: pack.branding.logo,
      shortName: pack.branding.shortName,
    },
    territory: pack.territory,
    languages: pack.languages?.length ? [...pack.languages] : ["es"],
    modules,
    source: "tenant_pack",
  };
}

/**
 * Resolve TenantConfiguration from pack adapter or future runtime source.
 */
export function resolveTenantConfiguration(
  source: TenantConfigurationSource,
  registry: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): TenantConfiguration {
  if (source.kind === "runtime") {
    return source.configuration;
  }
  return tenantPackToTenantConfiguration(source.pack, registry);
}

/**
 * Module availability helper — not a permission check.
 * Unknown module ids → false (fail closed for navigation).
 */
export function isTenantModuleEnabled(
  configuration: TenantConfiguration,
  moduleId: string,
): boolean {
  const direct = configuration.modules[moduleId];
  if (direct) return direct.enabled;

  for (const entry of Object.values(configuration.modules)) {
    if (entry.submodules && moduleId in entry.submodules) {
      return Boolean(entry.submodules[moduleId]);
    }
  }
  return false;
}

/**
 * Configuration presets expressable by the adapter.
 * - full_product: complete Community OS showcase (reference demo)
 * - minimal_community: core living modules; official extras / commerce off
 */
export type TenantConfigurationPreset = "full_product" | "minimal_community";

/** Module ids that stay on in MINIMAL COMMUNITY MODE. */
const MINIMAL_COMMUNITY_ENABLED_IDS: ReadonlySet<string> = new Set([
  "community",
  "community.channels",
  "community.groups",
  "community.proposals",
  "activities",
  "sports",
  "experiences",
  "reservations",
  "services",
  "nearby",
  "identity",
  "official",
  "administration",
]);

/**
 * Apply a visibility preset onto an existing TenantConfiguration.
 * Does not remove modules from the map — only toggles enabled.
 */
export function applyTenantConfigurationPreset(
  configuration: TenantConfiguration,
  preset: TenantConfigurationPreset,
  registry: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): TenantConfiguration {
  if (preset === "full_product") {
    const modules: Record<string, TenantModuleEnablement> = {};
    for (const module of listPlatformModules(registry)) {
      const existing = configuration.modules[module.id];
      modules[module.id] = {
        enabled: true,
        submodules: existing?.submodules
          ? Object.fromEntries(
              Object.keys(existing.submodules).map((id) => [id, true]),
            )
          : undefined,
      };
    }
    // Rebuild root trees with all children true
    for (const root of registry) {
      const submodules: Record<string, boolean> = {};
      for (const child of root.submodules ?? []) {
        submodules[child.id] = true;
        for (const grand of child.submodules ?? []) {
          submodules[grand.id] = true;
        }
      }
      modules[root.id] = {
        enabled: true,
        submodules:
          Object.keys(submodules).length > 0 ? submodules : undefined,
      };
    }
    return { ...configuration, modules };
  }

  // minimal_community
  const modules: Record<string, TenantModuleEnablement> = {};
  for (const module of listPlatformModules(registry)) {
    modules[module.id] = {
      enabled: MINIMAL_COMMUNITY_ENABLED_IDS.has(module.id),
    };
  }
  for (const root of registry) {
    const submodules: Record<string, boolean> = {};
    for (const child of root.submodules ?? []) {
      submodules[child.id] = MINIMAL_COMMUNITY_ENABLED_IDS.has(child.id);
      for (const grand of child.submodules ?? []) {
        submodules[grand.id] = MINIMAL_COMMUNITY_ENABLED_IDS.has(grand.id);
      }
    }
    modules[root.id] = {
      enabled: MINIMAL_COMMUNITY_ENABLED_IDS.has(root.id),
      submodules:
        Object.keys(submodules).length > 0 ? submodules : undefined,
    };
  }
  return { ...configuration, modules };
}

/** True when every registered module id is present in configuration.modules. */
export function assertTenantConfigurationCoversRegistry(
  configuration: TenantConfiguration,
  registry: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): { ok: boolean; missing: string[] } {
  const missing = listPlatformModules(registry)
    .map((m) => m.id)
    .filter((id) => !(id in configuration.modules));
  return { ok: missing.length === 0, missing };
}
