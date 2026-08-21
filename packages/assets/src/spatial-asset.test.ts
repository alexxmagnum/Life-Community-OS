import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PLATFORM_SPATIAL_ASSETS } from "./spatial-asset-library";
import {
  assignSpatialAssetToTerritoryType,
  clearSpatialAssetAssignments,
  resolveSpatialAssetForTerritoryObject,
} from "./spatial-asset-assignment";
import { shouldLoadSpatialGlb, spatialGlbUrlForView } from "./spatial-asset-pipeline";
import {
  createSpatialAssetRegistry,
  getPlatformSpatialAssetRegistry,
} from "./spatial-asset-registry";
import type { SpatialAsset } from "./spatial-asset";

const tenantBooth: SpatialAsset = {
  id: "valley-only-booth",
  name: "Valley booth",
  category: "security",
  format: "glb",
  url: "/assets/3d/platform/spatial/security/security-booth/lod0/security-booth.glb",
  scale: 1,
  lod: [
    {
      level: 0,
      url: "/assets/3d/platform/spatial/security/security-booth/lod0/security-booth.glb",
    },
  ],
  metadata: {
    units: "meters",
    pivot: "bottom-center",
    footprintMeters: { x: 2, z: 2 },
    heightMeters: 2.5,
    tenantId: "life-valley",
    compression: "none",
    style: "premium-hospitality",
  },
};

describe("SpatialAssetRegistry", () => {
  it("TEST 1 — registered asset appears in the registry", () => {
    const registry = getPlatformSpatialAssetRegistry();
    assert.equal(registry.has("security-gate-v1"), true);
    const asset = registry.get("security-gate-v1");
    assert.equal(asset?.format, "glb");
    assert.equal(asset?.metadata.tenantId, null);
    assert.ok(asset?.url.endsWith(".glb"));
  });

  it("TEST 2 — TerritoryObject without asset does not throw", () => {
    const resolved = resolveSpatialAssetForTerritoryObject({
      type: "green",
      location: { lat: 37.4, lng: -4.7 },
    });
    assert.equal(resolved, null);
  });

  it("TEST 3 — foreign-tenant SpatialAsset is denied", () => {
    const registry = createSpatialAssetRegistry();
    assert.equal(registry.register(tenantBooth).ok, true);
    assert.equal(registry.resolve("valley-only-booth", { tenantId: "life-panoramica" }), null);
    assert.ok(registry.resolve("valley-only-booth", { tenantId: "life-valley" }));
  });

  it("TEST 4 — GLB loads only at allowed zoom", () => {
    const asset = getPlatformSpatialAssetRegistry().get("clubhouse-v1");
    assert.ok(asset);
    if (!asset) return;
    assert.equal(shouldLoadSpatialGlb({ zoom: 13.2, asset, hasPosition: true }), false);
    assert.equal(spatialGlbUrlForView({ zoom: 13.2, asset, hasPosition: true }), null);
    const mid = spatialGlbUrlForView({ zoom: 15.2, asset, hasPosition: true });
    assert.ok(mid?.includes("/lod2/"));
    const high = spatialGlbUrlForView({ zoom: 18.0, asset, hasPosition: true });
    assert.ok(high?.includes("/lod0/"));
  });

  it("TEST 5 — asset without coordinates does not appear", () => {
    const url = getPlatformSpatialAssetRegistry().resolveUrl("security-gate-v1", {
      hasPosition: false,
      zoom: 18,
    });
    assert.equal(url, null);
    const withCoords = resolveSpatialAssetForTerritoryObject(
      {
        type: "gate",
        asset: { key: "security-gate-v1" },
        location: { lat: 37.41, lng: -4.75 },
      },
      { zoom: 18, hasPosition: true },
    );
    assert.equal(withCoords?.id, "security-gate-v1");
  });

  it("TEST 6 — renderer does not load invisible assets", () => {
    const asset = getPlatformSpatialAssetRegistry().get("pool-area-v1");
    assert.ok(asset);
    if (!asset) return;
    assert.equal(
      shouldLoadSpatialGlb({
        zoom: 18,
        asset,
        hasPosition: true,
        visible: false,
      }),
      false,
    );
    assert.equal(
      getPlatformSpatialAssetRegistry().resolveUrl("pool-area-v1", {
        zoom: 18,
        visible: false,
        hasPosition: true,
      }),
      null,
    );
  });

  it("admin assignment maps territory type without code in the renderer", () => {
    clearSpatialAssetAssignments();
    assignSpatialAssetToTerritoryType("sports", "tennis-court-v1");
    const resolved = resolveSpatialAssetForTerritoryObject({
      type: "sports",
      location: { lat: 1, lng: 1 },
    });
    assert.equal(resolved?.id, "tennis-court-v1");
    clearSpatialAssetAssignments();
  });

  it("legacy semantic keys alias into the GLB library", () => {
    const asset = getPlatformSpatialAssetRegistry().resolve(
      "utility.security.spatial_object",
    );
    assert.equal(asset?.id, "security-booth-v1");
  });

  it("initial library GLB files exist on disk", () => {
    const srcDir = path.dirname(fileURLToPath(import.meta.url));
    const publicRoot = path.resolve(srcDir, "../../../apps/web/public");
    assert.equal(PLATFORM_SPATIAL_ASSETS.length, 12);
    for (const asset of PLATFORM_SPATIAL_ASSETS) {
      for (const lod of asset.lod) {
        const filePath = path.join(publicRoot, lod.url.replace(/^\//, ""));
        assert.equal(fs.existsSync(filePath), true, `missing ${lod.url}`);
        const bytes = fs.readFileSync(filePath);
        assert.equal(bytes.toString("ascii", 0, 4), "glTF");
      }
    }
  });
});
