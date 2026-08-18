/**
 * Generic durable JSON blobs per tenant + key (provider state).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

const DATA_DIR = path.join(process.cwd(), ".data", "durable");

function safeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function filePath(tenantSlug: string, key: string): string {
  return path.join(DATA_DIR, tenantSlug, `${safeKey(key)}.json`);
}

export async function readDurableJson<T>(
  tenantId: string,
  key: string,
): Promise<T | null> {
  const slug = resolveTenantPublicId(tenantId);
  try {
    const raw = await fs.readFile(filePath(slug, key), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeDurableJson(
  tenantId: string,
  key: string,
  value: unknown,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  const dir = path.join(DATA_DIR, slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath(slug, key), JSON.stringify(value), "utf8");
}
