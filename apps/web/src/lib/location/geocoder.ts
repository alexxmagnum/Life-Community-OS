/**
 * App-facing AddressGeocoder singleton.
 * Browser → `/api/geocode` proxy → Nominatim (configurable provider).
 */

import type { AddressGeocoder } from "@life-community-os/types";
import { createWebAddressGeocoder } from "./web-geocoder";

let cached: AddressGeocoder | null = null;

export function getAddressGeocoder(): AddressGeocoder {
  if (cached) return cached;
  cached = createWebAddressGeocoder();
  return cached;
}
