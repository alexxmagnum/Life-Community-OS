/**
 * Lightweight Life Map telemetry hooks — production readiness foundation.
 * Hosts may subscribe; default is no-op (no vendor lock-in).
 */

export type LifeMapTelemetryEvent =
  | {
      type: "life_map.opened";
      tenantId: string;
      territoryId: string;
      dataVersion?: string;
    }
  | {
      type: "life_map.object_selected";
      tenantId: string;
      objectId: string;
      objectType: string;
    }
  | {
      type: "life_map.layer_loaded";
      tenantId: string;
      layer: string;
      featureCount: number;
      cacheKey?: string;
    }
  | {
      type: "life_map.budget_applied";
      quality: string;
      maxBuildings: number;
      maxMarkers: number;
    };

export type LifeMapTelemetrySink = (event: LifeMapTelemetryEvent) => void;

const sinks = new Set<LifeMapTelemetrySink>();

export function subscribeLifeMapTelemetry(sink: LifeMapTelemetrySink): () => void {
  sinks.add(sink);
  return () => {
    sinks.delete(sink);
  };
}

export function emitLifeMapTelemetry(event: LifeMapTelemetryEvent): void {
  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      // Never break the map for observability.
    }
  }
}
