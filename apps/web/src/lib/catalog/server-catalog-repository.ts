/**
 * Tenant-scoped content catalogs — community / experiences / marketplace / resources.
 * Seeded once from tenant packs; thereafter durable per tenant in Postgres.
 */

import {
  readTenantDocument,
  writeTenantDocument,
  type DocumentScope,
} from "@/lib/data/tenant-document-store";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export type CatalogDomain =
  | "community"
  | "experiences"
  | "marketplace"
  | "resources";

export const CATALOG_DOMAINS: readonly CatalogDomain[] = [
  "community",
  "experiences",
  "marketplace",
  "resources",
] as const;

export type CatalogScope = DocumentScope;

function docKey(domain: CatalogDomain): string {
  return `catalog:${domain}`;
}

export async function readCatalog<T = unknown>(
  tenantId: string,
  domain: CatalogDomain,
  scope?: CatalogScope,
): Promise<T[] | null> {
  const slug = resolveTenantPublicId(tenantId);
  const parsed = await readTenantDocument<T[]>(slug, docKey(domain), scope);
  if (!parsed) return null;
  return Array.isArray(parsed) ? parsed : null;
}

export async function writeCatalog(
  tenantId: string,
  domain: CatalogDomain,
  items: unknown[],
  scope?: CatalogScope,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  await writeTenantDocument(slug, docKey(domain), items, scope);
}

export async function ensureCatalogSeeded(
  tenantId: string,
  domain: CatalogDomain,
  seed: unknown[],
  scope?: CatalogScope,
): Promise<unknown[]> {
  const existing = await readCatalog(tenantId, domain, scope);
  if (existing && existing.length > 0) return existing;
  await writeCatalog(tenantId, domain, seed, scope);
  return seed;
}
