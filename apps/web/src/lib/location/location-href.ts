/**
 * Stable deep-links for Location SoT — map focus + ficha.
 * Catalog entity ids (lp-*, lv-*) map to loc-catalog-{entity}-{tenant}.
 */

export function catalogLocationId(entityId: string, tenantId: string): string {
  const trimmed = entityId.trim();
  if (trimmed.startsWith("loc-catalog-") || trimmed.startsWith("loc-")) {
    return trimmed;
  }
  return `loc-catalog-${trimmed}-${tenantId}`;
}

/** Open map with pin selected. */
export function locationMapFocusHref(locationId: string): string {
  return `/map?focus=${encodeURIComponent(locationId)}`;
}

/** Open Location ficha (manage / detail). */
export function locationFichaHref(locationId: string): string {
  return `/locations/${encodeURIComponent(locationId)}`;
}

/**
 * Resolve a legacy LocalEntity / catalog id to product hrefs.
 * Prefer map for “where is it”; ficha for manage.
 */
export function resolvePlaceHref(input: {
  entityOrLocationId: string;
  tenantId: string;
  prefer?: "map" | "ficha";
}): string {
  const locationId = catalogLocationId(
    input.entityOrLocationId,
    input.tenantId,
  );
  return input.prefer === "ficha"
    ? locationFichaHref(locationId)
    : locationMapFocusHref(locationId);
}
