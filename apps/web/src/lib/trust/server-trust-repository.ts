/**
 * Trust privacy store — only visibility flags.
 * Signals are always computed from domain activity. Not a TrustEntity.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  DEFAULT_TRUST_PRIVACY,
  mergeTrustPrivacy,
  type TrustPrivacy,
} from "@life-community-os/types";
import {
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

type TrustPrivacyRecord = {
  personId: string;
  tenantId: string;
  privacy: TrustPrivacy;
};

type TrustStore = {
  privacy: TrustPrivacyRecord[];
  deliveredThanksIds: string[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "trust");
const memory = new Map<string, TrustStore>();

function emptyStore(): TrustStore {
  return { privacy: [], deliveredThanksIds: [] };
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(tenantSlug: string): Promise<TrustStore> {
  if (!isFilePersistenceAllowed()) return emptyStore();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<TrustStore>;
    return {
      privacy: Array.isArray(parsed.privacy) ? parsed.privacy : [],
      deliveredThanksIds: Array.isArray(parsed.deliveredThanksIds)
        ? parsed.deliveredThanksIds
        : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(tenantSlug: string, store: TrustStore): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2));
}

async function loadStore(tenantId: string): Promise<TrustStore> {
  const slug = resolveTenantPublicId(tenantId);
  const cached = memory.get(slug);
  if (cached) return cached;
  const fromFile = await readFileStore(slug);
  memory.set(slug, fromFile);
  return fromFile;
}

async function persistStore(tenantId: string, store: TrustStore): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  memory.set(slug, store);
  if (isFilePersistenceAllowed()) {
    await writeFileStore(slug, store);
  }
}

export async function getTrustPrivacyServer(input: {
  tenantId: string;
  personId: string;
}): Promise<TrustPrivacy> {
  const store = await loadStore(input.tenantId);
  const row = store.privacy.find(
    (item) =>
      item.personId === input.personId && item.tenantId === input.tenantId,
  );
  return row ? mergeTrustPrivacy(row.privacy) : { ...DEFAULT_TRUST_PRIVACY };
}

export async function patchTrustPrivacyServer(input: {
  tenantId: string;
  personId: string;
  privacy: Partial<TrustPrivacy>;
}): Promise<TrustPrivacy> {
  const store = await loadStore(input.tenantId);
  const current = await getTrustPrivacyServer(input);
  const next = mergeTrustPrivacy({ ...current, ...input.privacy });
  const index = store.privacy.findIndex(
    (item) =>
      item.personId === input.personId && item.tenantId === input.tenantId,
  );
  const record: TrustPrivacyRecord = {
    personId: input.personId,
    tenantId: input.tenantId,
    privacy: next,
  };
  if (index >= 0) store.privacy[index] = record;
  else store.privacy.push(record);
  await persistStore(input.tenantId, store);
  return next;
}

export async function hasDeliveredThanksServer(input: {
  tenantId: string;
  key: string;
}): Promise<boolean> {
  const store = await loadStore(input.tenantId);
  return store.deliveredThanksIds.includes(input.key);
}

export async function markThanksDeliveredServer(input: {
  tenantId: string;
  key: string;
}): Promise<void> {
  const store = await loadStore(input.tenantId);
  if (store.deliveredThanksIds.includes(input.key)) return;
  store.deliveredThanksIds.push(input.key);
  await persistStore(input.tenantId, store);
}

export async function replaceTrustStoreForTests(
  tenantId: string,
  store: TrustStore = emptyStore(),
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  memory.set(slug, {
    privacy: [...store.privacy],
    deliveredThanksIds: [...store.deliveredThanksIds],
  });
  if (isFilePersistenceAllowed()) {
    await writeFileStore(slug, memory.get(slug)!);
  }
}
