/**
 * Life Map asset3DKey → 3D visual resolver (web host).
 * SpatialAssetRegistry → GLB url. Components never import GLB files.
 */

import {
  ensurePlatformSpatialCatalog,
  resolveLifeMapAsset3DKey,
  resolveSpatialAsset,
  resolveSpatialAssetUrl,
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
    const spatial = resolveSpatialAsset(asset3DKey, {
      ...(tenantId ? { tenantId } : {}),
    });
    const modelPath =
      resolveSpatialAssetUrl(asset3DKey, {
        ...(tenantId ? { tenantId } : {}),
        hasPosition: true,
      }) ?? spatial?.url;

    try {
      const meta = resolveLifeMapAsset3DKey(
        asset3DKey,
        tenantId ? { tenant: tenantId } : undefined,
      );
      return {
        key: meta.key,
        path: meta.path,
        ...(modelPath
          ? { modelPath }
          : meta.spatial?.modelPath
            ? { modelPath: meta.spatial.modelPath }
            : {}),
        visualKind: inferLifeMap3DAssetVisualKind(asset3DKey),
        labelHint: meta.spatial?.category ?? spatial?.category,
      };
    } catch {
      if (modelPath) {
        return {
          key: asset3DKey,
          modelPath,
          visualKind: inferLifeMap3DAssetVisualKind(asset3DKey),
          labelHint: spatial?.category,
        };
      }
      return procedural(asset3DKey);
    }
  };
}
