/**
 * Canonical tenant identity mapping — slug (product DomainId) ↔ UUID (DB).
 * Panorámica is a tenant, not the platform.
 */

export const LIFE_PANORAMICA_TENANT_SLUG = "life-panoramica";

export const LIFE_PANORAMICA_TENANT_UUID =
  "10000000-0000-4000-8000-000000000001";

export const LIFE_PANORAMICA_TERRITORY_UUID =
  "10000000-0000-4000-8000-000000000002";

const SLUG_TO_UUID: Record<string, string> = {
  [LIFE_PANORAMICA_TENANT_SLUG]: LIFE_PANORAMICA_TENANT_UUID,
};

const UUID_TO_SLUG: Record<string, string> = {
  [LIFE_PANORAMICA_TENANT_UUID]: LIFE_PANORAMICA_TENANT_SLUG,
};

export function tenantSlugToUuid(slugOrId: string): string | null {
  const key = slugOrId.trim().toLowerCase();
  if (SLUG_TO_UUID[key]) return SLUG_TO_UUID[key];
  if (UUID_TO_SLUG[key]) return key;
  // Accept already-canonical UUID shaped ids for future tenants.
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

export function resolveTenantPublicId(slugOrId: string): string {
  const trimmed = slugOrId.trim();
  if (!trimmed) return LIFE_PANORAMICA_TENANT_SLUG;
  const slug = tenantUuidToSlug(trimmed);
  if (slug) return slug;
  return trimmed.toLowerCase();
}
