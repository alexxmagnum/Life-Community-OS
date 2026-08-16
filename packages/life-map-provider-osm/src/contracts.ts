/**
 * OSM-internal contracts for extract planning and future transport.
 * No HTTP, Overpass, or geometry payloads.
 */

import type {
  TerritoryBootstrapGeneratedLayer,
  TerritoryBootstrapWarning,
  TerritoryDataSource,
  TerritoryImportLayerKind,
} from "@life-community-os/types";
import type { OsmLayerCapability, OsmSupportedLayerKind } from "./capabilities";

/**
 * Provider-facing request to resolve one OSM layer for a territory.
 * Address / name context only — never coordinates.
 */
export type OsmLayerExtractRequest = {
  tenantId: string;
  territoryName: string;
  country: string;
  layerKind: OsmSupportedLayerKind;
  territoryId?: string;
  capability: OsmLayerCapability;
};

/**
 * Planned extract descriptor — what a future Overpass/export would fetch.
 * Does not contain geometry or API URLs with secrets.
 */
export type OsmLayerExtractPlan = {
  provider: "osm";
  layerKind: OsmSupportedLayerKind;
  tagHints: readonly string[];
  territoryName: string;
  country: string;
  /** Opaque planned source pointer (not a download URL). */
  plannedSourceRef: string;
  /** Opaque planned dataRef for LifeMapBaseLayer (null until extract exists). */
  plannedDataRef: string | null;
};

export type OsmTransportStatus = "planned" | "available" | "unavailable";

/**
 * Result of an OSM transport attempt.
 * Foundation stub returns `planned`; real Overpass binds later as `available`.
 */
export type OsmTransportResult =
  | {
      status: "planned" | "available";
      source: TerritoryDataSource;
      layer: TerritoryBootstrapGeneratedLayer;
    }
  | {
      status: "unavailable";
      warning: TerritoryBootstrapWarning;
    };

/**
 * Injectable transport frontier for future Overpass / Geofabrik / export.
 * Default implementation never calls the network.
 */
export type OsmTransport = {
  resolveLayer(
    request: OsmLayerExtractRequest,
  ): OsmTransportResult | Promise<OsmTransportResult>;
};

export type OsmProviderAdapterOptions = {
  /**
   * Optional transport. When omitted, a planned-only stub is used
   * (no HTTP, no geometry).
   */
  transport?: OsmTransport;
  /** Dataset version stamp for planned sources. Default: `planned`. */
  plannedVersion?: string;
};

/** Build a safe opaque planned sourceRef (no vendor SDK / secrets). */
export function buildOsmPlannedSourceRef(input: {
  tenantId: string;
  layerKind: TerritoryImportLayerKind;
  territoryId?: string;
}): string {
  const scope = input.territoryId?.trim() || input.tenantId.trim() || "unknown";
  return `provider://osm/${scope}/${input.layerKind}/planned`;
}

export function buildOsmSourceId(input: {
  tenantId: string;
  layerKind: TerritoryImportLayerKind;
  territoryId?: string;
}): string {
  const scope = input.territoryId?.trim() || input.tenantId.trim() || "unknown";
  return `osm-${scope}-${input.layerKind}`;
}
