/**
 * Life Map — territory data ingestion contracts (platform Core).
 *
 * External sources (OSM, GIS, CAD, GeoJSON, Catastro, …) are NEVER the
 * internal model. They are described here and projected into LifeMapBaseLayer.
 *
 * No map SDK, no network fetch, no geometry payloads, no tenant catalogs.
 */

import type { DomainId } from "./ids";
import type {
  LifeMapBaseLayer,
  LifeMapBaseLayerSourceType,
  LifeMapBaseLayerStyle,
  LifeMapBaseLayerType,
  LifeMapCoordinateReferenceSystem,
} from "./life-map";
import { isLifeMapBaseLayerType } from "./life-map";

// ── External source catalog ──────────────────────────────────

/**
 * Logical provider family — not an SDK client and not an API token.
 * Concrete adapters bind these later (MapLibre, Cesium, custom GIS, …).
 */
export type TerritoryDataProviderKind =
  | "osm"
  | "gis"
  | "cad"
  | "geojson"
  | "catastro"
  | "custom"
  | (string & {});

/**
 * On-disk / interchange format of the referenced payload.
 * Independent from which renderer will consume the projected base layer.
 */
export type TerritoryDataFormat =
  | "vector"
  | "geojson"
  | "geotiff"
  | "cad"
  | "mesh"
  | "unknown"
  | (string & {});

/**
 * External territorial dataset reference.
 * Lives outside the product model until projected to LifeMapBaseLayer.
 */
export type TerritoryDataSource = {
  /** Stable id within the tenant pack (e.g. "panoramica-osm-extract"). */
  id: string;
  /** Provider family — never a Mapbox/Google token or SDK config blob. */
  provider: TerritoryDataProviderKind;
  format: TerritoryDataFormat;
  /**
   * Opaque pointer to the external payload
   * (e.g. `tenant://life-panoramica/sources/roads.geojson`).
   */
  sourceRef: string;
  crs: LifeMapCoordinateReferenceSystem;
  /** Dataset / extract version for cache invalidation. */
  version: string;
  label?: string;
};

// ── Layer import (external → LifeMapBaseLayer) ───────────────

/**
 * External layer kinds we know how to map into LifeMapBaseLayerType.
 * Custom strings require an explicit `targetType` on the import.
 */
export type TerritoryImportLayerKind =
  | "terrain"
  | "roads"
  | "buildings"
  | "water"
  | "green"
  | "boundary"
  | (string & {});

export const TERRITORY_IMPORT_LAYER_KINDS: readonly TerritoryImportLayerKind[] =
  ["terrain", "roads", "buildings", "water", "green", "boundary"] as const;

/**
 * One import instruction: an external layer file/extract → base layer slot.
 * Does not embed coordinates — only references and mapping metadata.
 */
export type TerritoryLayerImport = {
  /** Stable import id (e.g. "import-roads-main"). */
  id: string;
  territoryId: DomainId;
  /** Optional link to {@link TerritoryDataSource.id}. */
  sourceId?: string;
  /**
   * External layer name / path hint (e.g. `roads.geojson`, `highways`).
   * Not parsed as geometry here.
   */
  externalLayer: string;
  /** Logical kind of the external layer. */
  layerKind: TerritoryImportLayerKind;
  /**
   * Target Life Map base type. Defaults from `layerKind` when it is a
   * known physical kind.
   */
  targetType?: LifeMapBaseLayerType;
  /**
   * Opaque data ref for the resulting LifeMapBaseLayer.
   * Usually mirrors or derives from the source `sourceRef`.
   */
  dataRef: string;
  sourceType?: LifeMapBaseLayerSourceType;
  visible?: boolean;
  zIndex?: number;
  label?: string;
  style?: LifeMapBaseLayerStyle;
};

export type TerritoryLayerImportIssueCode =
  | "missing_ids"
  | "empty_data_ref"
  | "unsafe_data_ref"
  | "unknown_target_type"
  | "missing_target_type"
  | "territory_mismatch";

export type TerritoryLayerImportIssue = {
  code: TerritoryLayerImportIssueCode;
  message: string;
};

export type TerritoryLayerImportResult =
  | { ok: true; layer: LifeMapBaseLayer }
  | { ok: false; issues: TerritoryLayerImportIssue[] };

/** Default composite order when import omits zIndex. */
export const LIFE_MAP_BASE_LAYER_DEFAULT_Z_INDEX: Readonly<
  Record<LifeMapBaseLayerType, number>
> = {
  terrain: 0,
  water: 10,
  green: 20,
  roads: 30,
  buildings: 40,
  boundary: 50,
  custom: 60,
};

const UNSAFE_REF_PATTERN =
  /(mapbox|google\.maps|cesium|pk\.|sk\.|api[_-]?key|access[_-]?token|secret)/i;

/**
 * Map a known import layer kind → LifeMapBaseLayerType.
 * Returns undefined for unknown / custom kinds (caller must set targetType).
 */
export function mapTerritoryImportKindToBaseLayerType(
  kind: TerritoryImportLayerKind,
): LifeMapBaseLayerType | undefined {
  if (isLifeMapBaseLayerType(kind) && kind !== "custom") {
    return kind;
  }
  return undefined;
}

export function assertSafeTerritoryDataRef(dataRef: string): void {
  const ref = dataRef.trim();
  if (!ref) {
    throw new Error("[life-map-ingestion] dataRef / sourceRef must be non-empty");
  }
  if (UNSAFE_REF_PATTERN.test(ref)) {
    throw new Error(
      `[life-map-ingestion] Ref must not embed map-vendor SDK names or secrets: "${ref}"`,
    );
  }
}

export function validateTerritoryDataSource(
  source: TerritoryDataSource,
): TerritoryLayerImportIssue[] {
  const issues: TerritoryLayerImportIssue[] = [];
  if (!source.id?.trim()) {
    issues.push({ code: "missing_ids", message: "TerritoryDataSource.id is required" });
  }
  if (!source.sourceRef?.trim()) {
    issues.push({
      code: "empty_data_ref",
      message: "TerritoryDataSource.sourceRef is required",
    });
  } else {
    try {
      assertSafeTerritoryDataRef(source.sourceRef);
    } catch (e) {
      issues.push({
        code: "unsafe_data_ref",
        message: e instanceof Error ? e.message : "Unsafe sourceRef",
      });
    }
  }
  if (!source.version?.trim()) {
    issues.push({
      code: "missing_ids",
      message: "TerritoryDataSource.version is required",
    });
  }
  return issues;
}

/**
 * Project one TerritoryLayerImport into a LifeMapBaseLayer.
 * Does not read files or invent geometry — only validates + maps metadata.
 */
export function projectTerritoryLayerImport(
  input: TerritoryLayerImport,
  options?: { expectedTerritoryId?: DomainId },
): TerritoryLayerImportResult {
  const issues: TerritoryLayerImportIssue[] = [];

  if (!input.id?.trim() || !input.territoryId?.trim()) {
    issues.push({
      code: "missing_ids",
      message: "id and territoryId are required",
    });
  }

  if (
    options?.expectedTerritoryId &&
    input.territoryId &&
    input.territoryId !== options.expectedTerritoryId
  ) {
    issues.push({
      code: "territory_mismatch",
      message: `Import territoryId "${input.territoryId}" does not match "${options.expectedTerritoryId}"`,
    });
  }

  if (!input.dataRef?.trim()) {
    issues.push({
      code: "empty_data_ref",
      message: "dataRef is required",
    });
  } else {
    try {
      assertSafeTerritoryDataRef(input.dataRef);
    } catch (e) {
      issues.push({
        code: "unsafe_data_ref",
        message: e instanceof Error ? e.message : "Unsafe dataRef",
      });
    }
  }

  const targetType =
    input.targetType ?? mapTerritoryImportKindToBaseLayerType(input.layerKind);

  if (!targetType) {
    issues.push({
      code: "missing_target_type",
      message:
        "targetType is required when layerKind is not a known base layer type",
    });
  } else if (!isLifeMapBaseLayerType(targetType)) {
    issues.push({
      code: "unknown_target_type",
      message: `Unknown LifeMapBaseLayerType: "${targetType}"`,
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const type = targetType as LifeMapBaseLayerType;
  const layer: LifeMapBaseLayer = {
    id: input.id.trim(),
    territoryId: input.territoryId,
    type,
    visible: input.visible ?? true,
    zIndex: input.zIndex ?? LIFE_MAP_BASE_LAYER_DEFAULT_Z_INDEX[type],
    dataRef: input.dataRef.trim(),
    sourceType: input.sourceType ?? "uri",
    label: input.label ?? input.externalLayer,
    ...(input.style ? { style: input.style } : {}),
  };

  return { ok: true, layer };
}

/**
 * Project many imports → LifeMapBaseLayer[].
 * Failed imports are collected; successful layers are returned in zIndex order.
 */
export function projectTerritoryLayerImports(
  imports: readonly TerritoryLayerImport[],
  options?: { expectedTerritoryId?: DomainId },
): {
  layers: LifeMapBaseLayer[];
  rejected: {
    importId: string;
    issues: TerritoryLayerImportIssue[];
  }[];
} {
  const layers: LifeMapBaseLayer[] = [];
  const rejected: {
    importId: string;
    issues: TerritoryLayerImportIssue[];
  }[] = [];

  for (const item of imports) {
    const result = projectTerritoryLayerImport(item, options);
    if (result.ok) {
      layers.push(result.layer);
    } else {
      rejected.push({ importId: item.id, issues: result.issues });
    }
  }

  layers.sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
  return { layers, rejected };
}
