/**
 * Materialize tenant pack catalogs into durable JSON (first-run seed).
 * Seeds come from the tenant pack — never from a slug if-tree.
 */

import { requireTenantPack } from "@/lib/tenant/registry";
import {
  ensureCatalogSeeded,
  type CatalogDomain,
} from "./server-catalog-repository";

export function catalogSeedFor(
  tenantSlug: string,
  domain: CatalogDomain,
): unknown[] {
  return requireTenantPack(tenantSlug).getCatalogSeed(domain);
}

/** Isolation helper — Valley experience ids stay lv- prefixed. */
export function lifeValleyExperienceSeedIds(): readonly string[] {
  return catalogSeedFor("life-valley", "experiences")
    .map((item) =>
      item && typeof item === "object" && "id" in item
        ? String((item as { id: unknown }).id)
        : "",
    )
    .filter(Boolean);
}

export async function bootstrapTenantCatalog(
  tenantSlug: string,
  domain: CatalogDomain,
): Promise<unknown[]> {
  const seed = catalogSeedFor(tenantSlug, domain);
  return ensureCatalogSeeded(tenantSlug, domain, seed);
}

export async function bootstrapAllCatalogs(
  tenantSlug: string,
): Promise<Record<CatalogDomain, unknown[]>> {
  const domains: CatalogDomain[] = [
    "community",
    "experiences",
    "marketplace",
    "resources",
  ];
  const out = {} as Record<CatalogDomain, unknown[]>;
  for (const domain of domains) {
    if (domain === "marketplace") {
      // Runtime marketplace is the MarketplaceListing domain, not pack catalog.
      out[domain] = [];
      continue;
    }
    out[domain] = await bootstrapTenantCatalog(tenantSlug, domain);
  }
  return out;
}
