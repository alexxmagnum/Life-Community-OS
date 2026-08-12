/**
 * Life Map renderer — object rendering contract.
 *
 * Consumes LifeMapObject + opaque asset references.
 * Never imports Housing / Services / Community / tenant packs.
 */

import type {
  LifeMapActionKind,
  LifeMapLayerId,
  LifeMapObject,
  LifeMapObjectState,
  LifeMapObjectType,
  LifeMapPosition,
} from "@life-community-os/types";

/**
 * Opaque spatial asset handle for the renderer.
 * `assetKey` matches `LifeMapObject.asset3DKey` / Asset Registry keys.
 * Engines resolve paths later — this package does not load binaries.
 */
export type LifeMapAssetReference = {
  assetKey: string;
  /**
   * Optional already-resolved public path (preview webp / future glb).
   * When omitted, engines may look up the shared Asset Registry.
   */
  path?: string;
};

/**
 * What the renderer needs to draw one spatial object.
 * Derived from LifeMapObject — domain refs stay opaque strings.
 */
export type LifeMapRenderableObject = {
  objectId: string;
  type: LifeMapObjectType;
  layerId: LifeMapLayerId;
  position: LifeMapPosition;
  state: LifeMapObjectState;
  availableActions: readonly LifeMapActionKind[];
  label?: string;
  asset?: LifeMapAssetReference;
  /**
   * Domain pointer echo for pick → route handlers outside the renderer.
   * Renderer must not interpret module semantics.
   */
  domainRef?: {
    moduleId: string;
    entityId: string;
    entityKind?: string;
  };
};

export type LifeMapObjectRenderOp =
  | { kind: "upsert"; object: LifeMapRenderableObject }
  | { kind: "remove"; objectId: string }
  | { kind: "clear" };

/**
 * Project a platform LifeMapObject into a renderable contract.
 * Asset path resolution is optional and caller-supplied.
 */
export function toLifeMapRenderableObject(
  object: LifeMapObject,
  asset?: LifeMapAssetReference,
): LifeMapRenderableObject {
  const resolvedAsset =
    asset ??
    (object.asset3DKey
      ? { assetKey: object.asset3DKey }
      : undefined);

  return {
    objectId: object.objectId,
    type: object.type,
    layerId: object.layerId,
    position: object.position,
    state: object.state,
    availableActions: [...object.availableActions],
    label: object.label,
    ...(resolvedAsset ? { asset: resolvedAsset } : {}),
    ...(object.ref
      ? {
          domainRef: {
            moduleId: object.ref.moduleId,
            entityId: object.ref.entityId,
            entityKind: object.ref.entityKind,
          },
        }
      : {}),
  };
}
