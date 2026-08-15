/**
 * Life Map — territory bootstrap execution foundation (platform Core).
 *
 * Executes a {@link TerritoryBootstrapPlan} against injectable
 * {@link TerritoryDataProviderAdapter}s (OSM, Catastro, GIS, CAD, …).
 *
 * Core ships the executor + adapter contract only — no real providers,
 * no network, no geometry, no tenant hardcoding.
 */

import type { DomainId } from "./ids";
import type {
  TerritoryDataProviderKind,
  TerritoryDataSource,
  TerritoryImportLayerKind,
} from "./life-map-territory-ingestion";
import type {
  TerritoryBootstrapGeneratedLayer,
  TerritoryBootstrapWarning,
} from "./life-map-territory-bootstrap";
import type {
  TerritoryBootstrapLayerRequirement,
  TerritoryBootstrapPlan,
  TerritoryBootstrapPlannedLayer,
} from "./life-map-territory-bootstrap-planner";

// ── Provider adapter contract ────────────────────────────────

/**
 * Input for a single layer attempt by a provider adapter.
 * Address/country context only — never coordinates or payloads.
 */
export type TerritoryDataProviderFetchRequest = {
  tenantId: DomainId;
  territoryName: string;
  country: string;
  layer: TerritoryBootstrapPlannedLayer;
  territoryId?: DomainId;
};

/**
 * Outcome of one adapter attempt — source + layer metadata, or a warning.
 * Adapters must not invent geometry here; they may only declare refs/plans.
 */
export type TerritoryDataProviderFetchResult =
  | {
      ok: true;
      source: TerritoryDataSource;
      layer: TerritoryBootstrapGeneratedLayer;
    }
  | {
      ok: false;
      warning: TerritoryBootstrapWarning;
    };

/**
 * Future-facing provider adapter (OSM, Catastro, GIS, CAD, …).
 * Implementations live outside Core; this interface stays SDK-free.
 */
export type TerritoryDataProviderAdapter = {
  readonly provider: TerritoryDataProviderKind;
  /** Whether this adapter can attempt the given physical layer kind. */
  supportsLayer(layerKind: TerritoryImportLayerKind): boolean;
  /**
   * Attempt to obtain metadata / refs for one planned layer.
   * Must not download in Core stubs; real adapters bind later.
   */
  fetchLayer(
    request: TerritoryDataProviderFetchRequest,
  ):
    | TerritoryDataProviderFetchResult
    | Promise<TerritoryDataProviderFetchResult>;
};

// ── Execution result ─────────────────────────────────────────

export type TerritoryBootstrapExecutionStatus =
  | "empty"
  | "partial"
  | "ready"
  | "failed";

/**
 * A planned layer that no adapter could satisfy.
 */
export type TerritoryBootstrapFailedLayer = {
  layerKind: TerritoryImportLayerKind;
  targetType: TerritoryBootstrapPlannedLayer["targetType"];
  requirement: TerritoryBootstrapLayerRequirement;
  triedProviders: readonly TerritoryDataProviderKind[];
  warnings: readonly TerritoryBootstrapWarning[];
  label?: string;
};

/**
 * Result of executing a bootstrap plan against available adapters.
 */
export type TerritoryBootstrapExecutionResult = {
  tenantId: DomainId;
  territoryId?: DomainId;
  territoryName: string;
  generatedSources: readonly TerritoryDataSource[];
  generatedLayers: readonly TerritoryBootstrapGeneratedLayer[];
  failedLayers: readonly TerritoryBootstrapFailedLayer[];
  warnings: readonly TerritoryBootstrapWarning[];
  status: TerritoryBootstrapExecutionStatus;
};

export type TerritoryBootstrapExecuteContext = {
  territoryId?: DomainId;
};

/**
 * Executes {@link TerritoryBootstrapPlan} → territorial sources/layers.
 */
export type TerritoryBootstrapExecutor = {
  execute(
    plan: TerritoryBootstrapPlan,
    context?: TerritoryBootstrapExecuteContext,
  ):
    | TerritoryBootstrapExecutionResult
    | Promise<TerritoryBootstrapExecutionResult>;
};

// ── Executor implementation ──────────────────────────────────

function indexAdapters(
  adapters: readonly TerritoryDataProviderAdapter[],
): Map<TerritoryDataProviderKind, TerritoryDataProviderAdapter> {
  const map = new Map<TerritoryDataProviderKind, TerritoryDataProviderAdapter>();
  for (const adapter of adapters) {
    if (!map.has(adapter.provider)) {
      map.set(adapter.provider, adapter);
    }
  }
  return map;
}

function deriveExecutionStatus(
  plan: TerritoryBootstrapPlan,
  generatedLayers: readonly TerritoryBootstrapGeneratedLayer[],
  failedLayers: readonly TerritoryBootstrapFailedLayer[],
): TerritoryBootstrapExecutionStatus {
  if (generatedLayers.length === 0 && failedLayers.length === 0) {
    return "empty";
  }

  const requiredFailed = failedLayers.some((f) => f.requirement === "required");
  if (requiredFailed && generatedLayers.length === 0) {
    return "failed";
  }
  if (requiredFailed || failedLayers.length > 0) {
    return generatedLayers.length > 0 ? "partial" : "failed";
  }

  const requiredKinds = new Set(
    plan.requestedLayers
      .filter((l) => l.requirement === "required")
      .map((l) => l.layerKind),
  );
  const gotRequired = [...requiredKinds].every((kind) =>
    generatedLayers.some((g) => g.layerKind === kind),
  );

  return gotRequired ? "ready" : "partial";
}

/**
 * Create an executor that walks the plan and tries injected adapters in order.
 * With zero adapters, every layer fails closed (`no_provider_wired`).
 */
export function createTerritoryBootstrapExecutor(
  adapters: readonly TerritoryDataProviderAdapter[] = [],
): TerritoryBootstrapExecutor {
  const byProvider = indexAdapters(adapters);

  return {
    async execute(plan, context = {}) {
      const warnings: TerritoryBootstrapWarning[] = [...plan.warnings];
      const generatedSources: TerritoryDataSource[] = [];
      const generatedLayers: TerritoryBootstrapGeneratedLayer[] = [];
      const failedLayers: TerritoryBootstrapFailedLayer[] = [];
      const sourceIds = new Set<string>();

      if (adapters.length === 0) {
        warnings.push({
          code: "no_provider_wired",
          message:
            "No TerritoryDataProviderAdapter instances registered — plan not executed against real providers",
        });
      }

      for (const planned of plan.requestedLayers) {
        const triedProviders: TerritoryDataProviderKind[] = [];
        const layerWarnings: TerritoryBootstrapWarning[] = [];
        let succeeded = false;

        for (const provider of planned.providerFallbackOrder) {
          triedProviders.push(provider);
          const adapter = byProvider.get(provider);

          if (!adapter) {
            layerWarnings.push({
              code: "provider_skipped",
              message: `No adapter registered for provider "${provider}"`,
              provider,
              layerKind: planned.layerKind,
            });
            continue;
          }

          if (!adapter.supportsLayer(planned.layerKind)) {
            layerWarnings.push({
              code: "provider_skipped",
              message: `Adapter "${provider}" does not support layer "${planned.layerKind}"`,
              provider,
              layerKind: planned.layerKind,
            });
            continue;
          }

          const result = await adapter.fetchLayer({
            tenantId: plan.tenantId,
            territoryName: plan.territoryName,
            country: plan.country,
            layer: planned,
            territoryId: context.territoryId,
          });

          if (!result.ok) {
            layerWarnings.push(result.warning);
            continue;
          }

          if (!sourceIds.has(result.source.id)) {
            sourceIds.add(result.source.id);
            generatedSources.push(result.source);
          }
          generatedLayers.push(result.layer);
          succeeded = true;
          break;
        }

        if (!succeeded) {
          if (layerWarnings.length === 0) {
            layerWarnings.push({
              code: "layer_unavailable",
              message: `No provider produced layer "${planned.layerKind}"`,
              layerKind: planned.layerKind,
            });
          }
          failedLayers.push({
            layerKind: planned.layerKind,
            targetType: planned.targetType,
            requirement: planned.requirement,
            triedProviders,
            warnings: layerWarnings,
            label: planned.label,
          });
          warnings.push(...layerWarnings);
        }
      }

      return {
        tenantId: plan.tenantId,
        territoryId: context.territoryId,
        territoryName: plan.territoryName,
        generatedSources,
        generatedLayers,
        failedLayers,
        warnings,
        status: deriveExecutionStatus(plan, generatedLayers, failedLayers),
      };
    },
  };
}

/**
 * Executor with no adapters — documents the frontier; all layers fail closed.
 */
export function createNullTerritoryBootstrapExecutor(): TerritoryBootstrapExecutor {
  return createTerritoryBootstrapExecutor([]);
}
