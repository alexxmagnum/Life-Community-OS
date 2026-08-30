/**
 * Canonical tenant identity mapping — slug (product DomainId) ↔ UUID (DB).
 * Rows come from the tenant manifest (configuration). Core logic stays generic.
 */

import {
  defaultTenantSlug,
  TENANT_MANIFEST,
  getTenantManifestRecord,
} from "./manifest";
import { territoryIdsForTenant } from "@life-community-os/types";

export const LIFE_PANORAMICA_TENANT_SLUG = "life-panoramica";
export const LIFE_VALLEY_TENANT_SLUG = "life-valley";
export const LIFE_OCEAN_HILLS_TENANT_SLUG = "life-ocean-hills";

const FALLBACK_SLUG = defaultTenantSlug();

export const REGISTERED_TENANT_SLUGS = TENANT_MANIFEST.map(
  (row) => row.slug,
) as readonly string[];

export type RegisteredTenantSlug = (typeof REGISTERED_TENANT_SLUGS)[number];

export function isRegisteredTenantSlug(value: string): boolean {
  return REGISTERED_TENANT_SLUGS.includes(value);
}

/**
 * Allowlisted slug only. Rejects path traversal and unknown tenants.
 */
export function sanitizeTenantSlug(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  if (!isRegisteredTenantSlug(normalized)) return null;
  return normalized;
}

export const LIFE_PANORAMICA_TENANT_UUID =
  TENANT_MANIFEST.find((row) => row.slug === LIFE_PANORAMICA_TENANT_SLUG)
    ?.tenantUuid ?? "10000000-0000-4000-8000-000000000001";
export const LIFE_PANORAMICA_TERRITORY_UUID =
  TENANT_MANIFEST.find((row) => row.slug === LIFE_PANORAMICA_TENANT_SLUG)
    ?.territoryUuid ?? "10000000-0000-4000-8000-000000000002";

export const LIFE_VALLEY_TENANT_UUID =
  TENANT_MANIFEST.find((row) => row.slug === LIFE_VALLEY_TENANT_SLUG)
    ?.tenantUuid ?? "20000000-0000-4000-8000-000000000001";
export const LIFE_VALLEY_TERRITORY_UUID =
  TENANT_MANIFEST.find((row) => row.slug === LIFE_VALLEY_TENANT_SLUG)
    ?.territoryUuid ?? "20000000-0000-4000-8000-000000000002";

export const LIFE_OCEAN_HILLS_TENANT_UUID =
  TENANT_MANIFEST.find((row) => row.slug === LIFE_OCEAN_HILLS_TENANT_SLUG)
    ?.tenantUuid ?? "30000000-0000-4000-8000-000000000001";
export const LIFE_OCEAN_HILLS_TERRITORY_UUID =
  TENANT_MANIFEST.find((row) => row.slug === LIFE_OCEAN_HILLS_TENANT_SLUG)
    ?.territoryUuid ?? "30000000-0000-4000-8000-000000000002";

const SLUG_TO_UUID: Record<string, string> = Object.fromEntries(
  TENANT_MANIFEST.map((row) => [row.slug, row.tenantUuid]),
);

const UUID_TO_SLUG: Record<string, string> = Object.fromEntries(
  TENANT_MANIFEST.map((row) => [row.tenantUuid, row.slug]),
);

const SLUG_TO_TERRITORY: Record<string, string> = Object.fromEntries(
  TENANT_MANIFEST.map((row) => [row.slug, row.territoryUuid]),
);

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

/** Tenant 1:N Territory — manifest may list many; default is territoryUuid. */
export function listTerritoryUuidsForTenant(slugOrId: string): string[] {
  const slug = resolveTenantPublicId(slugOrId);
  const record = getTenantManifestRecord(slug);
  if (!record) return [];
  return [...territoryIdsForTenant(record)];
}

export function resolveTenantPublicId(slugOrId: string): string {
  const trimmed = slugOrId.trim();
  if (!trimmed) return FALLBACK_SLUG;
  const fromUuid = tenantUuidToSlug(trimmed);
  if (fromUuid) return fromUuid;
  const sanitized = sanitizeTenantSlug(trimmed);
  if (sanitized) return sanitized;
  return FALLBACK_SLUG;
}
