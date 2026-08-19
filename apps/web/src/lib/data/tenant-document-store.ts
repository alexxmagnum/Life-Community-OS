/**
 * Tenant-owned JSON documents in Postgres (conversations, reservations, catalogs, housing).
 * File fallback is a development fixture only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";

const DATA_DIR = path.join(process.cwd(), ".data", "documents");

export type DocumentScope = {
  accessToken?: string | null;
  personId?: string | null;
};

function filePath(tenantSlug: string, docKey: string): string {
  const safe = docKey.replace(/[^a-zA-Z0-9._:-]/g, "_");
  return path.join(DATA_DIR, tenantSlug, `${safe}.json`);
}

async function readFileDocument<T>(
  tenantSlug: string,
  docKey: string,
): Promise<T | null> {
  if (!isFilePersistenceAllowed()) return null;
  try {
    const raw = await fs.readFile(filePath(tenantSlug, docKey), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeFileDocument(
  tenantSlug: string,
  docKey: string,
  value: unknown,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  const dir = path.join(DATA_DIR, tenantSlug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath(tenantSlug, docKey), JSON.stringify(value), "utf8");
}

export async function readTenantDocument<T>(
  tenantId: string,
  docKey: string,
  scope?: DocumentScope,
): Promise<T | null> {
  const slug = resolveTenantPublicId(tenantId);
  const tenantUuid = tenantSlugToUuid(slug);

  if (isDatabaseConfigured() && tenantUuid) {
    const client = await createDomainDatabaseClient(scope);
    if (client) {
      const { data, error } = await client
        .from("tenant_documents")
        .select("payload")
        .eq("tenant_id", tenantUuid)
        .eq("doc_key", docKey)
        .maybeSingle();
      if (error) {
        console.warn("[tenant_documents] read failed", error.message);
        if (!isFilePersistenceAllowed()) {
          throw new PersistenceUnavailableError(error.message);
        }
      } else {
        return (data?.payload as T) ?? null;
      }
    } else if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError();
    }
  } else if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }

  return readFileDocument<T>(slug, docKey);
}

export async function writeTenantDocument(
  tenantId: string,
  docKey: string,
  payload: unknown,
  scope?: DocumentScope,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  const tenantUuid = tenantSlugToUuid(slug);

  if (isDatabaseConfigured() && tenantUuid) {
    const client = await createDomainDatabaseClient(scope);
    if (client) {
      const { error } = await client.from("tenant_documents").upsert({
        tenant_id: tenantUuid,
        doc_key: docKey,
        payload: payload ?? {},
        updated_by: scope?.personId ?? null,
        updated_at: new Date().toISOString(),
      });
      if (!error) return;
      console.warn("[tenant_documents] write failed", error.message);
      if (!isFilePersistenceAllowed()) {
        throw new PersistenceUnavailableError(error.message);
      }
    } else if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError();
    }
  } else if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }

  await writeFileDocument(slug, docKey, payload);
}
