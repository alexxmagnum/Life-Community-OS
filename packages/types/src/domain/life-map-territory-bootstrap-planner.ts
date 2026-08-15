/**
 * Life Map — territory bootstrap planner (platform Core).
 *
 * Provider-agnostic plan of which physical layers to attempt and in which
 * provider order. Does not call OSM / Catastro / GIS / CAD, does not download,
 * and never invents geometry.
 */

import type { DomainId } from "./ids";
import type { LifeMapBaseLayerType } from "./life-map";
import type {
  TerritoryDataProviderKind,
  TerritoryImportLayerKind,
} from "./life-map-territory-ingestion";
import { mapTerritoryImportKindToBaseLayerType } from "./life-map-territory-ingestion";
import type {
  TerritoryBootstrapProviderPreference,
  TerritoryBootstrapRequest,
  TerritoryBootstrapWarning,
} from "./life-map-territory-bootstrap";
import {
  TERRITORY_BOOTSTRAP_DEFAULT_PROVIDERS,
  validateTerritoryBootstrapRequest,
} from "./life-map-territory-bootstrap";

// ── Layer policy ─────────────────────────────────────────────

export type TerritoryBootstrapLayerRequirement = "required" | "optional";

/** Always attempt these layers for a new SaaS territory. */
export const TERRITORY_BOOTSTRAP_REQUIRED_LAYERS: readonly TerritoryImportLayerKind[] =
  ["roads", "buildings"] as const;

/** Attempt when coverage / product needs them — never blocking. */
export const TERRITORY_BOOTSTRAP_OPTIONAL_LAYERS: readonly TerritoryImportLayerKind[] =
  ["water", "green", "boundary"] as const;

/**
 * Default provider fallback per layer kind.
 * Orchestrators may override; Core does not execute providers.
 */
export const TERRITORY_BOOTSTRAP_LAYER_PROVIDER_FALLBACKS: Readonly<
  Record<string, readonly TerritoryDataProviderKind[]>
> = {
  roads: ["osm", "gis", "cad"],
  buildings: ["catastro", "osm", "gis", "cad"],
  water: ["osm", "gis", "cad"],
  green: ["osm", "gis", "cad"],
  boundary: ["gis", "cad", "osm", "catastro"],
};

// ── Plan model ───────────────────────────────────────────────

/**
 * One layer the bootstrap should attempt to obtain later.
 */
export type TerritoryBootstrapPlannedLayer = {
  layerKind: TerritoryImportLayerKind;
  targetType: LifeMapBaseLayerType;
  requirement: TerritoryBootstrapLayerRequirement;
  /** Ordered providers to try for this layer (first = preferred). */
  providerFallbackOrder: readonly TerritoryDataProviderKind[];
  label?: string;
};

/**
 * Provider-agnostic bootstrap plan — what to try, not what was fetched.
 */
export type TerritoryBootstrapPlan = {
  tenantId: DomainId;
  territoryName: string;
  country: string;
  /** Layers the platform intends to obtain (required + optional). */
  requestedLayers: readonly TerritoryBootstrapPlannedLayer[];
  /** Enabled preferred providers from the request (or platform defaults). */
  preferredProviders: readonly TerritoryDataProviderKind[];
  /**
   * Global fallback order when a layer has no specific chain.
   * Merges request preferences with {@link TERRITORY_BOOTSTRAP_DEFAULT_PROVIDERS}.
   */
  fallbackOrder: readonly TerritoryDataProviderKind[];
  warnings: readonly TerritoryBootstrapWarning[];
};

export type PlanTerritoryBootstrapOptions = {
  /** When false, only required layers (roads, buildings). Default true. */
  includeOptionalLayers?: boolean;
};

// ── Planner ──────────────────────────────────────────────────

function defaultLabelForLayer(kind: TerritoryImportLayerKind): string {
  switch (kind) {
    case "roads":
      return "Roads";
    case "buildings":
      return "Buildings";
    case "water":
      return "Water";
    case "green":
      return "Green areas";
    case "boundary":
      return "Boundary";
    case "terrain":
      return "Terrain";
    default:
      return String(kind);
  }
}

function mergeProviderOrder(
  preferences: readonly TerritoryBootstrapProviderPreference[] | undefined,
): {
  preferredProviders: TerritoryDataProviderKind[];
  fallbackOrder: TerritoryDataProviderKind[];
  warnings: TerritoryBootstrapWarning[];
} {
  const warnings: TerritoryBootstrapWarning[] = [];
  const enabledPrefs = (preferences ?? []).filter((p) => p.enabled !== false);

  const preferredProviders: TerritoryDataProviderKind[] = [];
  const seen = new Set<string>();

  const sortedPrefs = [...enabledPrefs].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
  );

  for (const pref of sortedPrefs) {
    if (!pref.provider || seen.has(pref.provider)) continue;
    seen.add(pref.provider);
    preferredProviders.push(pref.provider);
  }

  const fallbackOrder: TerritoryDataProviderKind[] = [...preferredProviders];
  for (const provider of TERRITORY_BOOTSTRAP_DEFAULT_PROVIDERS) {
    if (seen.has(provider)) continue;
    seen.add(provider);
    fallbackOrder.push(provider);
  }

  if (preferredProviders.length === 0) {
    warnings.push({
      code: "provider_skipped",
      message:
        "No provider preferences supplied — using platform default order (osm, catastro, gis, cad)",
    });
  }

  return {
    preferredProviders:
      preferredProviders.length > 0
        ? preferredProviders
        : [...TERRITORY_BOOTSTRAP_DEFAULT_PROVIDERS],
    fallbackOrder,
    warnings,
  };
}

function providerFallbackForLayer(
  layerKind: TerritoryImportLayerKind,
  globalFallback: readonly TerritoryDataProviderKind[],
  preferences: readonly TerritoryBootstrapProviderPreference[] | undefined,
): TerritoryDataProviderKind[] {
  const layerSpecificPrefs = (preferences ?? [])
    .filter(
      (p) =>
        p.enabled !== false &&
        p.layerKinds &&
        p.layerKinds.includes(layerKind),
    )
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
    .map((p) => p.provider);

  const defaults =
    TERRITORY_BOOTSTRAP_LAYER_PROVIDER_FALLBACKS[layerKind] ?? globalFallback;

  const order: TerritoryDataProviderKind[] = [];
  const seen = new Set<string>();

  for (const provider of [...layerSpecificPrefs, ...defaults, ...globalFallback]) {
    if (seen.has(provider)) continue;
    seen.add(provider);
    order.push(provider);
  }

  return order;
}

/**
 * Build a provider-agnostic {@link TerritoryBootstrapPlan} from a request.
 * Pure planning — no network, no geometry, no tenant hardcoding.
 */
export function planTerritoryBootstrap(
  request: TerritoryBootstrapRequest,
  options: PlanTerritoryBootstrapOptions = {},
): TerritoryBootstrapPlan {
  const includeOptional = options.includeOptionalLayers !== false;
  const validationWarnings = validateTerritoryBootstrapRequest(request);
  const providerMerge = mergeProviderOrder(request.providerPreferences);

  const layerSpecs: {
    kind: TerritoryImportLayerKind;
    requirement: TerritoryBootstrapLayerRequirement;
  }[] = [
    ...TERRITORY_BOOTSTRAP_REQUIRED_LAYERS.map((kind) => ({
      kind,
      requirement: "required" as const,
    })),
  ];

  if (includeOptional) {
    for (const kind of TERRITORY_BOOTSTRAP_OPTIONAL_LAYERS) {
      layerSpecs.push({ kind, requirement: "optional" });
    }
  }

  const requestedLayers: TerritoryBootstrapPlannedLayer[] = [];
  const warnings: TerritoryBootstrapWarning[] = [
    ...validationWarnings,
    ...providerMerge.warnings,
  ];

  for (const spec of layerSpecs) {
    const targetType = mapTerritoryImportKindToBaseLayerType(spec.kind);
    if (!targetType) {
      warnings.push({
        code: "layer_unavailable",
        message: `Cannot map layer kind "${spec.kind}" to LifeMapBaseLayerType`,
        layerKind: spec.kind,
      });
      continue;
    }

    requestedLayers.push({
      layerKind: spec.kind,
      targetType,
      requirement: spec.requirement,
      providerFallbackOrder: providerFallbackForLayer(
        spec.kind,
        providerMerge.fallbackOrder,
        request.providerPreferences,
      ),
      label: defaultLabelForLayer(spec.kind),
    });
  }

  return {
    tenantId: request.tenantId,
    territoryName: request.territoryName,
    country: request.country,
    requestedLayers,
    preferredProviders: providerMerge.preferredProviders,
    fallbackOrder: providerMerge.fallbackOrder,
    warnings,
  };
}
