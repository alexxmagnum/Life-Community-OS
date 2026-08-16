/**
 * Default OSM transport — declares planned sources/layers only.
 * Never downloads, never invents geometry.
 */

import type {
  OsmLayerExtractRequest,
  OsmTransport,
  OsmTransportResult,
} from "./contracts";
import {
  buildOsmPlannedSourceRef,
  buildOsmSourceId,
} from "./contracts";

export type PlannedOsmTransportOptions = {
  plannedVersion?: string;
};

export function createPlannedOsmTransport(
  options: PlannedOsmTransportOptions = {},
): OsmTransport {
  const version = options.plannedVersion?.trim() || "planned";

  return {
    resolveLayer(request: OsmLayerExtractRequest): OsmTransportResult {
      const sourceId = buildOsmSourceId(request);
      const sourceRef = buildOsmPlannedSourceRef(request);

      return {
        status: "planned",
        source: {
          id: sourceId,
          provider: "osm",
          format: "geojson",
          sourceRef,
          crs: "WGS84",
          version,
          label: request.capability.label,
        },
        layer: {
          layerKind: request.layerKind,
          targetType: request.layerKind,
          dataRef: null,
          status: "planned",
          sourceId,
          label: request.capability.label,
        },
      };
    },
  };
}
