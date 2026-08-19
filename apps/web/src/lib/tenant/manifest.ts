/**
 * Deployment tenant identity — configuration, not product logic.
 * Add a customer by appending a record (plus a tenant pack).
 */

import type { TenantIdentityRecord } from "@life-community-os/types";

export const TENANT_MANIFEST: readonly TenantIdentityRecord[] = [
  {
    slug: "life-panoramica",
    name: "Panorámica Golf",
    tenantUuid: "10000000-0000-4000-8000-000000000001",
    territoryUuid: "10000000-0000-4000-8000-000000000002",
    hostHints: ["life-panoramica", "panoramica"],
    locale: "es",
    timezone: "Europe/Madrid",
    defaultFallback: true,
  },
  {
    slug: "life-valley",
    name: "Life Valley",
    tenantUuid: "20000000-0000-4000-8000-000000000001",
    territoryUuid: "20000000-0000-4000-8000-000000000002",
    hostHints: ["life-valley"],
    locale: "es",
    timezone: "Europe/Madrid",
  },
  {
    slug: "life-ocean-hills",
    name: "Ocean Hills Community",
    tenantUuid: "30000000-0000-4000-8000-000000000001",
    territoryUuid: "30000000-0000-4000-8000-000000000002",
    hostHints: ["life-ocean-hills", "oceanhills", "ocean-hills"],
    locale: "en",
    timezone: "Atlantic/Canary",
  },
] as const;

export function listTenantManifest(): readonly TenantIdentityRecord[] {
  return TENANT_MANIFEST;
}

export function getTenantManifestRecord(
  slug: string,
): TenantIdentityRecord | null {
  return TENANT_MANIFEST.find((row) => row.slug === slug) ?? null;
}

export function defaultTenantSlug(): string {
  return TENANT_MANIFEST.find((row) => row.defaultFallback)?.slug ?? "life-panoramica";
}
