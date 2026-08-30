/**
 * Community help repository (help + work board).
 *
 * Owner is session created_by. Client owner ids are ignored.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createHelpRequestRecord,
  type HelpRequest,
  type HelpRequestStatus,
  type HelpRequestType,
} from "@life-community-os/types";
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
import {
  asTerritoryUuid,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

export type HelpWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

const DATA_DIR = path.join(process.cwd(), ".data", "help");

function fixtureEnabled(): boolean {
  return process.env.LCOS_HELP_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(tenantSlug: string): Promise<HelpRequest[]> {
  if (!isFilePersistenceAllowed()) return [];
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as HelpRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFileStore(
  tenantSlug: string,
  items: HelpRequest[],
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(items, null, 2));
}

type HelpRow = {
  id: string;
  tenant_id: string;
  territory_id: string | null;
  created_by: string;
  type: HelpRequestType;
  category: string;
  title: string;
  description: string;
  status: HelpRequestStatus;
  author_display_name: string;
  created_at: string;
  updated_at: string;
};

function rowToHelp(row: HelpRow, tenantSlug: string): HelpRequest {
  return {
    id: row.id,
    tenantId: tenantSlug,
    createdBy: row.created_by,
    type: row.type,
    category: row.category,
    title: row.title,
    description: row.description,
    status: row.status,
    authorDisplayName: row.author_display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.territory_id ? { territoryId: row.territory_id } : {}),
  };
}

async function loadHelp(
  tenantSlug: string,
  scope?: HelpWriteScope,
): Promise<HelpRequest[]> {
  if (fixtureEnabled() && isFilePersistenceAllowed()) return readFileStore(tenantSlug);
  if (!isDatabaseConfigured()) {
    if (!isFilePersistenceAllowed()) throw new PersistenceUnavailableError();
    return readFileStore(tenantSlug);
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return [];
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    return [];
  }
  const { data, error } = await client
    .from("community_help_requests")
    .select("*")
    .eq("tenant_id", tenantUuid);
  if (error) {
    console.warn("[help] list failed", error.message);
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    throw new PersistenceUnavailableError(error.message);
  }
  return (data as HelpRow[]).map((row) => rowToHelp(row, tenantSlug));
}

async function persistHelp(
  item: HelpRequest,
  scope?: HelpWriteScope,
): Promise<void> {
  const slug = resolveTenantPublicId(item.tenantId);
  if (fixtureEnabled() && isFilePersistenceAllowed()) {
    const existing = await readFileStore(slug);
    await writeFileStore(slug, [
      ...existing.filter((row) => row.id !== item.id),
      item,
    ]);
    return;
  }
  if (isDatabaseConfigured()) {
    const tenantUuid = tenantSlugToUuid(slug);
    const client = tenantUuid
      ? await createDomainDatabaseClient(scope)
      : null;
    if (client && tenantUuid) {
      const { error } = await client.from("community_help_requests").upsert({
        id: item.id,
        tenant_id: tenantUuid,
        territory_id: asTerritoryUuid(item.territoryId),
        created_by: item.createdBy,
        type: item.type,
        category: item.category,
        title: item.title,
        description: item.description,
        status: item.status,
        author_display_name: item.authorDisplayName,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      });
      if (!error) return;
      console.warn("[help] upsert failed", error.message);
    }
  }
  const existing = await readFileStore(slug);
  await writeFileStore(slug, [
    ...existing.filter((row) => row.id !== item.id),
    item,
  ]);
}

export async function listHelpRequestsServer(
  tenantId: string,
  scope?: HelpWriteScope,
): Promise<HelpRequest[]> {
  return loadHelp(resolveTenantPublicId(tenantId), scope);
}

export async function getHelpRequestServer(
  tenantId: string,
  helpId: string,
  scope?: HelpWriteScope,
): Promise<HelpRequest | null> {
  const all = await listHelpRequestsServer(tenantId, scope);
  return all.find((item) => item.id === helpId) ?? null;
}

export async function createHelpRequestServer(input: {
  tenantId: string;
  createdBy: string;
  type: HelpRequestType;
  category?: string;
  title: string;
  description: string;
  authorDisplayName?: string;
  territoryId?: string;
  createdByFromClient?: string | null;
  scope?: HelpWriteScope;
}): Promise<HelpRequest> {
  void input.createdByFromClient;
  const item = createHelpRequestRecord({
    tenantId: resolveTenantPublicId(input.tenantId),
    createdBy: input.createdBy,
    type: input.type,
    category: input.category ?? "general",
    title: input.title,
    description: input.description,
    authorDisplayName: input.authorDisplayName,
    status: "open",
    territoryId: resolveStampTerritoryId({
      tenantId: input.tenantId,
      explicit: input.territoryId,
    }),
  });
  await persistHelp(item, input.scope);
  return item;
}

export async function updateHelpRequestServer(input: {
  tenantId: string;
  helpId: string;
  patch: {
    title?: string;
    description?: string;
    category?: string;
    type?: HelpRequestType;
    status?: HelpRequestStatus;
  };
  scope?: HelpWriteScope,
}): Promise<HelpRequest | null> {
  const existing = await getHelpRequestServer(
    input.tenantId,
    input.helpId,
    input.scope,
  );
  if (!existing) return null;
  const next = createHelpRequestRecord({
    ...existing,
    title: input.patch.title ?? existing.title,
    description: input.patch.description ?? existing.description,
    category: input.patch.category ?? existing.category,
    type: input.patch.type ?? existing.type,
    status: input.patch.status ?? existing.status,
    createdBy: existing.createdBy,
    id: existing.id,
    tenantId: existing.tenantId,
    authorDisplayName: existing.authorDisplayName,
    territoryId: existing.territoryId,
  });
  next.createdAt = existing.createdAt;
  next.updatedAt = new Date().toISOString();
  await persistHelp(next, input.scope);
  return next;
}

export async function replaceHelpStoreForTests(
  tenantId: string,
  items: HelpRequest[] = [],
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), items);
}
