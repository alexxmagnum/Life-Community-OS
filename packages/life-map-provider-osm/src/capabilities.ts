/**
 * OSM provider capability declaration.
 * Documents which physical layers this adapter may attempt — no network.
 */

import type { TerritoryImportLayerKind } from "@life-community-os/types";

/** Layer kinds the OSM adapter supports in this foundation. */
export const OSM_SUPPORTED_LAYER_KINDS = [
  "roads",
  "buildings",
  "water",
] as const;

export type OsmSupportedLayerKind = (typeof OSM_SUPPORTED_LAYER_KINDS)[number];

/**
 * One OSM layer capability — tag hints for a future Overpass / extract step.
 * Hints are documentation for the provider, never executed here.
 */
export type OsmLayerCapability = {
  layerKind: OsmSupportedLayerKind;
  /** OSM tag filters (e.g. `highway=*`) — not a live query. */
  tagHints: readonly string[];
  /** Human label for bootstrap / diagnostics. */
  label: string;
};

export const OSM_LAYER_CAPABILITIES: readonly OsmLayerCapability[] = [
  {
    layerKind: "roads",
    tagHints: ["highway=*"],
    label: "OSM roads",
  },
  {
    layerKind: "buildings",
    tagHints: ["building=*"],
    label: "OSM buildings",
  },
  {
    layerKind: "water",
    tagHints: ["natural=water", "waterway=*"],
    label: "OSM water",
  },
] as const;

const SUPPORTED = new Set<string>(OSM_SUPPORTED_LAYER_KINDS);

export function isOsmSupportedLayerKind(
  layerKind: TerritoryImportLayerKind,
): layerKind is OsmSupportedLayerKind {
  return SUPPORTED.has(layerKind);
}

export function getOsmLayerCapability(
  layerKind: TerritoryImportLayerKind,
): OsmLayerCapability | undefined {
  if (!isOsmSupportedLayerKind(layerKind)) return undefined;
  return OSM_LAYER_CAPABILITIES.find((c) => c.layerKind === layerKind);
}
