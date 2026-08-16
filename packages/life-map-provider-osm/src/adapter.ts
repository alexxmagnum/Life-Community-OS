/**
 * OSM {@link TerritoryDataProviderAdapter} — first concrete provider adapter.
 *
 * Knows OSM layer capabilities and planned extract metadata.
 * Does not call Overpass / HTTP; does not know React, MapLibre, Three, or tenants.
 */

import type {
  TerritoryDataProviderAdapter,
  TerritoryDataProviderFetchRequest,
  TerritoryDataProviderFetchResult,
  TerritoryImportLayerKind,
} from "@life-community-os/types";
import {
  getOsmLayerCapability,
  isOsmSupportedLayerKind,
} from "./capabilities";
import type { OsmProviderAdapterOptions, OsmTransport } from "./contracts";
import { createPlannedOsmTransport } from "./planned-transport";

export function createOsmTerritoryDataProviderAdapter(
  options: OsmProviderAdapterOptions = {},
): TerritoryDataProviderAdapter {
  const transport: OsmTransport =
    options.transport ??
    createPlannedOsmTransport({ plannedVersion: options.plannedVersion });

  return {
    provider: "osm",

    supportsLayer(layerKind: TerritoryImportLayerKind): boolean {
      return isOsmSupportedLayerKind(layerKind);
    },

    async fetchLayer(
      request: TerritoryDataProviderFetchRequest,
    ): Promise<TerritoryDataProviderFetchResult> {
      const { layerKind } = request.layer;

      if (!isOsmSupportedLayerKind(layerKind)) {
        return {
          ok: false,
          warning: {
            code: "provider_skipped",
            message: `OSM adapter does not support layer "${layerKind}"`,
            provider: "osm",
            layerKind,
          },
        };
      }

      const capability = getOsmLayerCapability(layerKind);
      if (!capability) {
        return {
          ok: false,
          warning: {
            code: "layer_unavailable",
            message: `OSM capability missing for layer "${layerKind}"`,
            provider: "osm",
            layerKind,
          },
        };
      }

      const result = await transport.resolveLayer({
        tenantId: request.tenantId,
        territoryName: request.territoryName,
        country: request.country,
        layerKind,
        territoryId: request.territoryId,
        capability,
      });

      if (result.status === "unavailable") {
        return { ok: false, warning: result.warning };
      }

      return {
        ok: true,
        source: result.source,
        layer: result.layer,
      };
    },
  };
}
