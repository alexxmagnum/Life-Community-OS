/**
 * Generic durable JSON blobs per tenant + key (provider state).
 * Postgres tenant_documents in production; .data fixture only in development.
 */

import {
  readTenantDocument,
  writeTenantDocument,
  type DocumentScope,
} from "@/lib/data/tenant-document-store";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export type DurableScope = DocumentScope;

function docKey(key: string): string {
  return `durable:${key}`;
}

export async function readDurableJson<T>(
  tenantId: string,
  key: string,
  scope?: DurableScope,
): Promise<T | null> {
  const slug = resolveTenantPublicId(tenantId);
  return readTenantDocument<T>(slug, docKey(key), scope);
}

export async function writeDurableJson(
  tenantId: string,
  key: string,
  value: unknown,
  scope?: DurableScope,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  await writeTenantDocument(slug, docKey(key), value ?? {}, scope);
}
