/**
 * Territory catalog for the experience layer.
 * Identity / configuration — never a tenant pack catalog.
 */

import {
  createTerritory,
  territoryIdsForTenant,
  type Territory,
} from "@life-community-os/types";
import { getTenantManifestRecord } from "./manifest";
import { resolveTenantPublicId } from "./ids";

export function identityTerritoriesForTenant(slugOrId: string): Territory[] {
  const slug = resolveTenantPublicId(slugOrId);
  const record = getTenantManifestRecord(slug);
  if (!record) return [];
  const ids = territoryIdsForTenant(record);
  return ids.map((id) =>
    createTerritory({
      id,
      tenantId: slug,
      name: record.name,
      status: "active",
      locale: record.locale,
      timezone: record.timezone,
    }),
  );
}

export function defaultTerritoryIdForIdentity(slugOrId: string): string | null {
  const slug = resolveTenantPublicId(slugOrId);
  const record = getTenantManifestRecord(slug);
  return record?.territoryUuid ?? null;
}
