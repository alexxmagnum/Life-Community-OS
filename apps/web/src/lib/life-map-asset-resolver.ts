/**
 * Life Map asset3DKey → 3D visual resolver (web host).
 * Asset Library → registry/spatial catalog → visualKind (+ optional glTF).
 */

import {
  ensurePlatformSpatialCatalog,
  resolveLifeMapAsset3DKey,
} from "@life-community-os/assets";
import {
  createProceduralLifeMap3DAssetResolver,
  inferLifeMap3DAssetVisualKind,
  type LifeMap3DAssetResolver,
} from "@life-community-os/life-map-renderer-3d-layer";

ensurePlatformSpatialCatalog();

export function createWebLifeMapAssetResolver(
  tenantId?: string,
): LifeMap3DAssetResolver {
  const procedural = createProceduralLifeMap3DAssetResolver();
  return (asset3DKey) => {
    try {
      const meta = resolveLifeMapAsset3DKey(
        asset3DKey,
        tenantId ? { tenant: tenantId } : undefined,
      );
      return {
        key: meta.key,
        path: meta.path,
        ...(meta.spatial?.modelPath
          ? { modelPath: meta.spatial.modelPath }
          : {}),
        visualKind: inferLifeMap3DAssetVisualKind(asset3DKey),
        labelHint: meta.spatial?.category,
      };
    } catch {
      return procedural(asset3DKey);
    }
  };
}
