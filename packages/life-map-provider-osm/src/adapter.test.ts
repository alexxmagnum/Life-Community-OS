import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createTerritoryBootstrapExecutor,
  planTerritoryBootstrap,
  type TerritoryBootstrapPlannedLayer,
  type TerritoryDataProviderFetchRequest,
} from "@life-community-os/types";
import { createOsmTerritoryDataProviderAdapter } from "./adapter";
import type { OsmTransport } from "./contracts";

function plannedLayer(
  layerKind: TerritoryBootstrapPlannedLayer["layerKind"],
): TerritoryBootstrapPlannedLayer {
  return {
    layerKind,
    targetType: layerKind as TerritoryBootstrapPlannedLayer["targetType"],
    requirement: layerKind === "roads" || layerKind === "buildings"
      ? "required"
      : "optional",
    providerFallbackOrder: ["osm"],
    label: layerKind,
  };
}

function fetchRequest(
  layerKind: TerritoryBootstrapPlannedLayer["layerKind"],
): TerritoryDataProviderFetchRequest {
  return {
    tenantId: "tenant-demo",
    territoryName: "Demo Territory",
    country: "ES",
    territoryId: "terr-demo",
    layer: plannedLayer(layerKind),
  };
}

describe("createOsmTerritoryDataProviderAdapter", () => {
  it("identifies as osm and supports initial layers", () => {
    const adapter = createOsmTerritoryDataProviderAdapter();
    assert.equal(adapter.provider, "osm");
    assert.equal(adapter.supportsLayer("roads"), true);
    assert.equal(adapter.supportsLayer("buildings"), true);
    assert.equal(adapter.supportsLayer("water"), true);
    assert.equal(adapter.supportsLayer("green"), false);
  });

  it("returns planned TerritoryDataSource + layer without geometry", async () => {
    const adapter = createOsmTerritoryDataProviderAdapter();
    const result = await adapter.fetchLayer(fetchRequest("roads"));
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.source.provider, "osm");
    assert.equal(result.source.format, "geojson");
    assert.equal(result.source.crs, "WGS84");
    assert.match(result.source.sourceRef, /^provider:\/\/osm\//);
    assert.equal(result.layer.layerKind, "roads");
    assert.equal(result.layer.dataRef, null);
    assert.equal(result.layer.status, "planned");
    assert.equal(result.layer.sourceId, result.source.id);
  });

  it("rejects unsupported layers", async () => {
    const adapter = createOsmTerritoryDataProviderAdapter();
    const result = await adapter.fetchLayer(fetchRequest("boundary"));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.warning.provider, "osm");
    assert.equal(result.warning.layerKind, "boundary");
  });

  it("delegates to injectable transport", async () => {
    const transport: OsmTransport = {
      resolveLayer() {
        return {
          status: "unavailable",
          warning: {
            code: "layer_unavailable",
            message: "stub transport blocked",
            provider: "osm",
            layerKind: "water",
          },
        };
      },
    };
    const adapter = createOsmTerritoryDataProviderAdapter({ transport });
    const result = await adapter.fetchLayer(fetchRequest("water"));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.warning.message, /stub transport/);
  });

  it("wires into TerritoryBootstrapExecutor", async () => {
    const adapter = createOsmTerritoryDataProviderAdapter();
    const executor = createTerritoryBootstrapExecutor([adapter]);
    const plan = planTerritoryBootstrap({
      tenantId: "tenant-demo",
      territoryName: "Demo Territory",
      country: "ES",
      location: { locality: "Demo", countryCode: "ES" },
      providerPreferences: [{ provider: "osm", enabled: true }],
    });

    const execution = await executor.execute(plan, {
      territoryId: "terr-demo",
    });

    const kinds = execution.generatedLayers.map((l) => l.layerKind);
    assert.ok(kinds.includes("roads"));
    assert.ok(kinds.includes("buildings"));
    assert.ok(kinds.includes("water"));
    assert.ok(
      execution.generatedSources.every((s) => s.provider === "osm"),
    );
    assert.ok(
      execution.failedLayers.some((f) => f.layerKind === "green") ||
        execution.failedLayers.some((f) => f.layerKind === "boundary"),
    );
  });
});
