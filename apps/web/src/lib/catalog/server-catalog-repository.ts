/**
 * Tenant-scoped content catalogs — community / experiences / marketplace / resources.
 * Seeded once from tenant packs; thereafter durable per tenant.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
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

const DATA_DIR = path.join(process.cwd(), ".data", "catalog");

function filePath(tenantSlug: string, domain: CatalogDomain): string {
  return path.join(DATA_DIR, tenantSlug, `${domain}.json`);
}

export async function readCatalog<T = unknown>(
  tenantId: string,
  domain: CatalogDomain,
): Promise<T[] | null> {
  const slug = resolveTenantPublicId(tenantId);
  try {
    const raw = await fs.readFile(filePath(slug, domain), "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeCatalog(
  tenantId: string,
  domain: CatalogDomain,
  items: unknown[],
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  const dir = path.join(DATA_DIR, slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath(slug, domain), JSON.stringify(items, null, 2), "utf8");
}

export async function ensureCatalogSeeded(
  tenantId: string,
  domain: CatalogDomain,
  seed: unknown[],
): Promise<unknown[]> {
  const existing = await readCatalog(tenantId, domain);
  if (existing && existing.length > 0) return existing;
  await writeCatalog(tenantId, domain, seed);
  return seed;
}
