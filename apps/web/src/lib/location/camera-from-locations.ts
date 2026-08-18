/**
 * Frame the map around published Locations (product priority),
 * never the full territory envelope when places exist.
 */

import type { Location } from "@life-community-os/types";

export type LocationCameraPose = {
  target: { lat: number; lng: number };
  distance: number;
  headingDegrees: number;
  pitchDegrees: number;
};

/**
 * First-frame hero — IKON owns the viewport; pool/sports stay as near context.
 * Composition only: does not change Location data.
 */
export function heroLocationsForFirstFrame(
  locations: readonly Location[],
): Location[] {
  const ikon =
    locations.find((location) =>
      location.name.trim().toLowerCase().includes("ikon"),
    ) ??
    locations.find((location) =>
      location.category.trim().toLowerCase().includes("restaurant"),
    );
  if (ikon) return [ikon];
  const pool = locations.find((location) =>
    location.category.trim().toLowerCase().includes("pool"),
  );
  if (pool) return [pool];
  return [...locations].slice(0, 1);
}

/**
 * Build a human-scale Look Around camera on the primary place.
 */
export function cameraPoseFromLocations(
  locations: readonly Location[],
  fallback?: Partial<LocationCameraPose> | null,
): LocationCameraPose | null {
  if (locations.length === 0) return null;

  const frame = heroLocationsForFirstFrame(locations);
  const anchor = frame[0]!;

  return {
    target: { lat: anchor.latitude, lng: anchor.longitude },
    distance: 380,
    headingDegrees: fallback?.headingDegrees ?? -18,
    pitchDegrees: fallback?.pitchDegrees ?? 48,
  };
}

/** Soft category tone for place chips / markers. */
export function placeToneForCategory(category: string): string {
  const key = category.trim().toLowerCase();
  if (key.includes("restaurant") || key.includes("lounge")) return "#c47848";
  if (key.includes("cafe")) return "#d4a060";
  if (key.includes("shop") || key.includes("market")) return "#c45c5c";
  if (
    key.includes("electrician") ||
    key.includes("veterinary") ||
    key.includes("vet") ||
    key.includes("service")
  ) {
    return "#c89040";
  }
  if (
    key.includes("sports") ||
    key.includes("padel") ||
    key.includes("pool") ||
    key.includes("facility")
  ) {
    return "#2f8a5a";
  }
  if (key.includes("event")) return "#a070c0";
  return "#5a9aaa";
}

export function placeShortLabelForCategory(category: string): string {
  const key = category.trim().toLowerCase();
  if (key.includes("restaurant") || key.includes("lounge")) return "Restaurante";
  if (key.includes("cafe")) return "Café";
  if (key.includes("shop") || key.includes("market")) return "Comercio";
  if (
    key.includes("electrician") ||
    key.includes("veterinary") ||
    key.includes("service")
  ) {
    return "Servicio";
  }
  if (key.includes("sports") || key.includes("padel") || key.includes("facility")) {
    return "Instalación";
  }
  if (key.includes("pool") || key.includes("piscina")) return "Piscina";
  if (key.includes("event")) return "Evento";
  return "Lugar";
}
