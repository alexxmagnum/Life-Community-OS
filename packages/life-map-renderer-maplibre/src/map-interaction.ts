/**
 * Premium map interaction — soft hover (desktop) + clear tap selection.
 * Prepares feature-state for future LifeMapObject wiring; no complex UI.
 */

import type { Map as MapLibreMap, MapGeoJSONFeature, MapMouseEvent } from "maplibre-gl";

import type { MapLibreBaseLayerBinding } from "./base-layer-binder";

export type LifeMapInteractionHandle = {
  clear(): void;
  getSelectedFeatureId(): string | number | null;
  detach(): void;
};

type FeatureRef = {
  sourceId: string;
  featureId: string | number;
};

function featureKey(ref: FeatureRef): string {
  return `${ref.sourceId}:${ref.featureId}`;
}

function readFeatureId(feature: MapGeoJSONFeature): string | number | null {
  const id = feature.id;
  if (typeof id === "string" || typeof id === "number") return id;
  return null;
}

/**
 * Attach hover + tap interaction to Life Map base fill layers (buildings).
 * Roads stay non-interactive for now (noise); water/green reserved for later.
 */
export function attachLifeMapPremiumInteraction(
  map: MapLibreMap,
  bindings: readonly MapLibreBaseLayerBinding[],
): LifeMapInteractionHandle {
  const interactive = bindings.filter((b) => b.type === "buildings");
  const layerIds = interactive.map((b) => b.layerId);
  const sourceByLayer = new Map(
    interactive.map((b) => [b.layerId, b.sourceId] as const),
  );

  let hovered: FeatureRef | null = null;
  let selected: FeatureRef | null = null;

  const setHoverState = (ref: FeatureRef | null, value: boolean) => {
    if (!ref) return;
    try {
      map.setFeatureState(
        { source: ref.sourceId, id: ref.featureId },
        { hover: value },
      );
    } catch {
      // Source may have been removed mid-sync.
    }
  };

  const setSelectedState = (ref: FeatureRef | null, value: boolean) => {
    if (!ref) return;
    try {
      map.setFeatureState(
        { source: ref.sourceId, id: ref.featureId },
        { selected: value },
      );
    } catch {
      // ignore
    }
  };

  const onMove = (event: MapMouseEvent) => {
    if (layerIds.length === 0) return;
    // Touch / coarse pointers: skip hover noise.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    const hits = map.queryRenderedFeatures(event.point, { layers: layerIds });
    const hit = hits[0];
    if (!hit) {
      if (hovered) {
        setHoverState(hovered, false);
        hovered = null;
        map.getCanvas().style.cursor = "";
      }
      return;
    }

    const sourceId = sourceByLayer.get(hit.layer.id);
    const featureId = readFeatureId(hit);
    if (!sourceId || featureId === null) return;

    const next: FeatureRef = { sourceId, featureId };
    if (hovered && featureKey(hovered) === featureKey(next)) return;

    if (hovered) setHoverState(hovered, false);
    hovered = next;
    setHoverState(hovered, true);
    map.getCanvas().style.cursor = "pointer";
  };

  const onLeave = () => {
    if (hovered) {
      setHoverState(hovered, false);
      hovered = null;
    }
    map.getCanvas().style.cursor = "";
  };

  const onClick = (event: MapMouseEvent) => {
    if (layerIds.length === 0) return;
    const hits = map.queryRenderedFeatures(event.point, { layers: layerIds });
    const hit = hits[0];
    if (!hit) {
      if (selected) {
        setSelectedState(selected, false);
        selected = null;
      }
      return;
    }

    const sourceId = sourceByLayer.get(hit.layer.id);
    const featureId = readFeatureId(hit);
    if (!sourceId || featureId === null) return;

    const next: FeatureRef = { sourceId, featureId };
    if (selected && featureKey(selected) === featureKey(next)) {
      setSelectedState(selected, false);
      selected = null;
      return;
    }

    if (selected) setSelectedState(selected, false);
    selected = next;
    setSelectedState(selected, true);
  };

  if (layerIds.length > 0) {
    map.on("mousemove", onMove);
    map.on("mouseleave", onLeave);
    map.on("click", onClick);
  }

  return {
    clear() {
      if (hovered) setHoverState(hovered, false);
      if (selected) setSelectedState(selected, false);
      hovered = null;
      selected = null;
      map.getCanvas().style.cursor = "";
    },
    getSelectedFeatureId() {
      return selected?.featureId ?? null;
    },
    detach() {
      this.clear();
      map.off("mousemove", onMove);
      map.off("mouseleave", onLeave);
      map.off("click", onClick);
    },
  };
}
