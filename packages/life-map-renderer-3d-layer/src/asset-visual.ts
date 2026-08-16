/**
 * Life Map 3D asset visual profiles — pipeline for asset3DKey.
 *
 * Resolves semantic keys to stylized spatial visuals.
 * Real glTF paths come from the Asset Registry when registered;
 * until then, procedural luxury-community meshes are used (no fake binaries).
 */

export type LifeMap3DAssetVisualKind =
  | "restaurant"
  | "cafe"
  | "pool"
  | "golf"
  | "padel"
  | "clubhouse"
  | "service"
  | "house"
  | "generic";

export type LifeMap3DAssetResolveResult = {
  key: string;
  /** Public path when registry has a binary — optional. */
  path?: string;
  visualKind: LifeMap3DAssetVisualKind;
  labelHint?: string;
};

export type LifeMap3DAssetResolver = (
  asset3DKey: string,
) => LifeMap3DAssetResolveResult | null;

/**
 * Infer a visual kind from Spatial Library-style keys.
 * Does not load files — vocabulary only.
 */
export function inferLifeMap3DAssetVisualKind(
  asset3DKey: string,
): LifeMap3DAssetVisualKind {
  const key = asset3DKey.toLowerCase();
  if (key.includes("restaurant") || key.includes("ikon")) return "restaurant";
  if (key.includes("cafe") || key.includes("clubhouse")) return "cafe";
  if (key.includes("pool")) return "pool";
  if (key.includes("golf")) return "golf";
  if (key.includes("padel") || key.includes("tennis")) return "padel";
  if (key.includes("service") || key.includes("garden")) return "service";
  if (key.includes("house") || key.includes("building")) return "house";
  if (key.includes("place.")) return "restaurant";
  if (key.includes("recreation.")) return "golf";
  return "generic";
}

/**
 * Default resolver — procedural profile from key; path left empty until catalog.
 */
export function createProceduralLifeMap3DAssetResolver(): LifeMap3DAssetResolver {
  return (asset3DKey) => {
    if (!asset3DKey || typeof asset3DKey !== "string") return null;
    return {
      key: asset3DKey,
      visualKind: inferLifeMap3DAssetVisualKind(asset3DKey),
    };
  };
}

export function resolveLifeMap3DAssetVisual(
  asset3DKey: string | undefined,
  resolver?: LifeMap3DAssetResolver | null,
): LifeMap3DAssetResolveResult | null {
  if (!asset3DKey) return null;
  if (resolver) {
    try {
      return resolver(asset3DKey);
    } catch {
      // Fail soft — procedural fallback.
    }
  }
  return createProceduralLifeMap3DAssetResolver()(asset3DKey);
}
