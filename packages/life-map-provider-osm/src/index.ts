/**
 * @life-community-os/life-map-provider-osm
 *
 * OpenStreetMap TerritoryDataProviderAdapter foundation.
 * No React, MapLibre, Three, tenant packs, HTTP, or geometry.
 */

export {
  OSM_SUPPORTED_LAYER_KINDS,
  OSM_LAYER_CAPABILITIES,
  isOsmSupportedLayerKind,
  getOsmLayerCapability,
} from "./capabilities";
export type {
  OsmSupportedLayerKind,
  OsmLayerCapability,
} from "./capabilities";

export {
  buildOsmPlannedSourceRef,
  buildOsmSourceId,
} from "./contracts";
export type {
  OsmLayerExtractRequest,
  OsmLayerExtractPlan,
  OsmTransportStatus,
  OsmTransportResult,
  OsmTransport,
  OsmProviderAdapterOptions,
} from "./contracts";

export { createPlannedOsmTransport } from "./planned-transport";
export type { PlannedOsmTransportOptions } from "./planned-transport";

export { createOsmTerritoryDataProviderAdapter } from "./adapter";
