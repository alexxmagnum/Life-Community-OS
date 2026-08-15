/**
 * Life Map — territory bootstrap contracts (platform Core).
 *
 * SaaS foundation for creating a new territory without requiring the
 * customer to supply GIS/CAD upfront. Providers (OSM, Catastro, municipal
 * GIS, private CAD) are optional preferences — Core never calls them here.
 *
 * No map SDK, no network fetch, no geometry payloads, no tenant catalogs,
 * no invented coordinates.
 */

import type { DomainId } from "./ids";
import type { LifeMapBaseLayerType } from "./life-map";
import type {
  TerritoryDataProviderKind,
  TerritoryDataSource,
  TerritoryImportLayerKind,
} from "./life-map-territory-ingestion";
import { assertSafeTerritoryDataRef } from "./life-map-territory-ingestion";
import { planTerritoryBootstrap } from "./life-map-territory-bootstrap-planner";

// ── Location input (non-geometric) ───────────────────────────

/**
 * Human / postal location for bootstrap discovery.
 * Never a coordinate pair — geocoding adapters bind later.
 */
export type TerritoryBootstrapLocationInput = {
  /** Free-text place or address query. */
  query?: string;
  street?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  /**
   * ISO 3166-1 alpha-2 when known (e.g. "ES").
   * Prefer this over free-text `country` on the request when both exist.
   */
  countryCode?: string;
};

// ── Provider preferences ─────────────────────────────────────

/**
 * Soft preference for which external families to try later.
 * Not an SDK config and not an API key.
 */
export type TerritoryBootstrapProviderPreference = {
  provider: TerritoryDataProviderKind;
  /** Lower runs first when a future orchestrator executes providers. */
  priority?: number;
  enabled?: boolean;
  /** Layer kinds this provider should attempt when wired. */
  layerKinds?: readonly TerritoryImportLayerKind[];
};

export const TERRITORY_BOOTSTRAP_DEFAULT_PROVIDERS: readonly TerritoryDataProviderKind[] =
  ["osm", "catastro", "gis", "cad"] as const;

// ── Request ──────────────────────────────────────────────────

/**
 * Request to plan / create a territory spatial frame for a tenant.
 * Does not embed geometry or vendor tokens.
 */
export type TerritoryBootstrapRequest = {
  tenantId: DomainId;
  /** Resident-facing territory name. */
  territoryName: string;
  /** Address / place input used by future discovery providers. */
  location: TerritoryBootstrapLocationInput;
  /**
   * Country label or ISO code (e.g. "Spain" / "ES").
   * Required for provider routing; not a coordinate.
   */
  country: string;
  /** Optional ordered provider preferences (OSM, Catastro, GIS, CAD, …). */
  providerPreferences?: readonly TerritoryBootstrapProviderPreference[];
  /** Optional client-suggested id — platform may allocate a different one. */
  requestedTerritoryId?: DomainId;
};

// ── Result ───────────────────────────────────────────────────

export type TerritoryBootstrapLayerStatus =
  | "planned"
  | "available"
  | "unavailable"
  | "pending";

export type TerritoryBootstrapStatus =
  | "planned"
  | "partial"
  | "ready"
  | "failed";

/**
 * One planned or discovered physical layer from bootstrap.
 * `dataRef` stays null until a real extract exists.
 */
export type TerritoryBootstrapGeneratedLayer = {
  layerKind: TerritoryImportLayerKind;
  targetType?: LifeMapBaseLayerType;
  /** Opaque ref when an extract is registered; null while only planned. */
  dataRef: string | null;
  status: TerritoryBootstrapLayerStatus;
  /** Optional link to {@link TerritoryDataSource.id}. */
  sourceId?: string;
  label?: string;
};

export type TerritoryBootstrapWarningCode =
  | "missing_tenant"
  | "missing_name"
  | "missing_country"
  | "missing_location"
  | "unsafe_data_ref"
  | "no_provider_wired"
  | "provider_skipped"
  | "layer_unavailable"
  | "partial_coverage"
  | (string & {});

export type TerritoryBootstrapWarning = {
  code: TerritoryBootstrapWarningCode;
  message: string;
  provider?: TerritoryDataProviderKind;
  layerKind?: TerritoryImportLayerKind;
};

/**
 * Bootstrap outcome — plan + discovered sources/layers.
 * Never invents geometry; empty sources/layers are valid.
 */
export type TerritoryBootstrapResult = {
  territoryId: DomainId;
  tenantId: DomainId;
  territoryName: string;
  /** Declared or discovered external datasets (may be empty). */
  availableSources: readonly TerritoryDataSource[];
  /** Planned / generated base-layer slots (may be empty). */
  generatedLayers: readonly TerritoryBootstrapGeneratedLayer[];
  warnings: readonly TerritoryBootstrapWarning[];
  status: TerritoryBootstrapStatus;
};

// ── Service frontier ─────────────────────────────────────────

/**
 * Injectable bootstrap orchestrator.
 * Concrete providers bind later — Core ships only the null/fail-closed stub.
 */
export type TerritoryBootstrapService = {
  bootstrap(
    request: TerritoryBootstrapRequest,
  ): TerritoryBootstrapResult | Promise<TerritoryBootstrapResult>;
};

// ── Validation ───────────────────────────────────────────────

export function validateTerritoryBootstrapRequest(
  request: TerritoryBootstrapRequest,
): TerritoryBootstrapWarning[] {
  const warnings: TerritoryBootstrapWarning[] = [];

  if (!request.tenantId?.trim()) {
    warnings.push({
      code: "missing_tenant",
      message: "tenantId is required",
    });
  }
  if (!request.territoryName?.trim()) {
    warnings.push({
      code: "missing_name",
      message: "territoryName is required",
    });
  }
  if (!request.country?.trim()) {
    warnings.push({
      code: "missing_country",
      message: "country is required",
    });
  }

  const loc = request.location;
  const hasLocationSignal = Boolean(
    loc?.query?.trim() ||
      loc?.street?.trim() ||
      loc?.locality?.trim() ||
      loc?.postalCode?.trim() ||
      loc?.region?.trim() ||
      loc?.countryCode?.trim(),
  );
  if (!hasLocationSignal) {
    warnings.push({
      code: "missing_location",
      message:
        "location requires at least one of query, street, locality, region, postalCode, or countryCode",
    });
  }

  if (request.requestedTerritoryId?.trim()) {
    try {
      // Reuse safe-ref rules so ids never embed vendor secrets.
      assertSafeTerritoryDataRef(request.requestedTerritoryId);
    } catch (e) {
      warnings.push({
        code: "unsafe_data_ref",
        message:
          e instanceof Error
            ? e.message
            : "requestedTerritoryId failed safety checks",
      });
    }
  }

  return warnings;
}

/**
 * Fail-closed bootstrap service — validates + plans layers, executes no providers.
 * No OSM / Catastro / GIS / CAD calls and no geometry.
 */
export function createNullTerritoryBootstrapService(): TerritoryBootstrapService {
  return {
    bootstrap(request) {
      const plan = planTerritoryBootstrap(request);
      const territoryId =
        request.requestedTerritoryId?.trim() ||
        `terr-bootstrap-${request.tenantId || "unknown"}`;

      const hasBlockingValidation = plan.warnings.some((w) =>
        [
          "missing_tenant",
          "missing_name",
          "missing_country",
          "missing_location",
          "unsafe_data_ref",
        ].includes(w.code),
      );

      const warnings: TerritoryBootstrapWarning[] = [
        ...plan.warnings,
        {
          code: "no_provider_wired",
          message:
            "Bootstrap plan ready — no providers wired yet (OSM, Catastro, GIS, CAD remain future adapters)",
        },
      ];

      const generatedLayers: TerritoryBootstrapGeneratedLayer[] =
        plan.requestedLayers.map((layer) => ({
          layerKind: layer.layerKind,
          targetType: layer.targetType,
          dataRef: null,
          status: "planned",
          label: layer.label,
        }));

      const status: TerritoryBootstrapStatus = hasBlockingValidation
        ? "failed"
        : "planned";

      return {
        territoryId,
        tenantId: request.tenantId,
        territoryName: request.territoryName,
        availableSources: [],
        generatedLayers,
        warnings,
        status,
      };
    },
  };
}
