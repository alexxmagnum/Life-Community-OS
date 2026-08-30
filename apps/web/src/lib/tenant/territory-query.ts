/**
 * Append Active Territory to client fetch URLs without breaking tenant-only callers.
 */

export function withTerritoryQuery(
  params: URLSearchParams,
  territoryId?: string | null,
): URLSearchParams {
  const trimmed = territoryId?.trim();
  if (trimmed) params.set("territoryId", trimmed);
  return params;
}
