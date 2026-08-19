/**
 * Canonical tenant identity mapping — slug (product DomainId) ↔ UUID (DB).
 * Tenants are packs on the platform — never the application itself.
 */

export const LIFE_PANORAMICA_TENANT_SLUG = "life-panoramica";
export const LIFE_VALLEY_TENANT_SLUG = "life-valley";

/** Product tenants that may appear in cookies, headers, or file paths. */
export const REGISTERED_TENANT_SLUGS = [
  LIFE_PANORAMICA_TENANT_SLUG,
  LIFE_VALLEY_TENANT_SLUG,
] as const;

export type RegisteredTenantSlug = (typeof REGISTERED_TENANT_SLUGS)[number];

export function isRegisteredTenantSlug(
  value: string,
): value is RegisteredTenantSlug {
  return (REGISTERED_TENANT_SLUGS as readonly string[]).includes(value);
}

/**
 * Allowlisted slug only. Rejects path traversal and unknown tenants.
 */
export function sanitizeTenantSlug(
  raw: string | null | undefined,
): RegisteredTenantSlug | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  if (!isRegisteredTenantSlug(normalized)) return null;
  return normalized;
}

export const LIFE_PANORAMICA_TENANT_UUID =
  "10000000-0000-4000-8000-000000000001";
export const LIFE_PANORAMICA_TERRITORY_UUID =
  "10000000-0000-4000-8000-000000000002";

export const LIFE_VALLEY_TENANT_UUID =
  "20000000-0000-4000-8000-000000000001";
export const LIFE_VALLEY_TERRITORY_UUID =
  "20000000-0000-4000-8000-000000000002";

const SLUG_TO_UUID: Record<string, string> = {
  [LIFE_PANORAMICA_TENANT_SLUG]: LIFE_PANORAMICA_TENANT_UUID,
  [LIFE_VALLEY_TENANT_SLUG]: LIFE_VALLEY_TENANT_UUID,
};

const UUID_TO_SLUG: Record<string, string> = {
  [LIFE_PANORAMICA_TENANT_UUID]: LIFE_PANORAMICA_TENANT_SLUG,
  [LIFE_VALLEY_TENANT_UUID]: LIFE_VALLEY_TENANT_SLUG,
};

const SLUG_TO_TERRITORY: Record<string, string> = {
  [LIFE_PANORAMICA_TENANT_SLUG]: LIFE_PANORAMICA_TERRITORY_UUID,
  [LIFE_VALLEY_TENANT_SLUG]: LIFE_VALLEY_TERRITORY_UUID,
};

export function tenantSlugToUuid(slugOrId: string): string | null {
  const key = slugOrId.trim().toLowerCase();
  if (SLUG_TO_UUID[key]) return SLUG_TO_UUID[key];
  if (UUID_TO_SLUG[key]) return key;
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    )
  ) {
    return key;
  }
  return null;
}

export function tenantUuidToSlug(uuid: string): string | null {
  const key = uuid.trim().toLowerCase();
  return UUID_TO_SLUG[key] ?? null;
}

export function tenantSlugToTerritoryUuid(slugOrId: string): string | null {
  const slug = resolveTenantPublicId(slugOrId);
  return SLUG_TO_TERRITORY[slug] ?? null;
}

export function resolveTenantPublicId(slugOrId: string): string {
  const trimmed = slugOrId.trim();
  if (!trimmed) return LIFE_PANORAMICA_TENANT_SLUG;
  const fromUuid = tenantUuidToSlug(trimmed);
  if (fromUuid) return fromUuid;
  const sanitized = sanitizeTenantSlug(trimmed);
  if (sanitized) return sanitized;
  return LIFE_PANORAMICA_TENANT_SLUG;
}
