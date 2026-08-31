/**
 * Governance store — rules, reports, safety actions, personal blocks.
 * Not a content domain. Signals point at existing entity ids.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  CommunityContentReport,
  CommunityRule,
  GovernancePersonBlock,
  GovernanceSafetyAction,
} from "@life-community-os/types";
import {
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export type GovernanceStore = {
  rules: CommunityRule[];
  reports: CommunityContentReport[];
  safetyActions: GovernanceSafetyAction[];
  blocks: GovernancePersonBlock[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "governance");
const memory = new Map<string, GovernanceStore>();

function emptyStore(): GovernanceStore {
  return { rules: [], reports: [], safetyActions: [], blocks: [] };
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(tenantSlug: string): Promise<GovernanceStore> {
  if (!isFilePersistenceAllowed()) return emptyStore();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<GovernanceStore>;
    return {
      rules: Array.isArray(parsed.rules) ? parsed.rules : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      safetyActions: Array.isArray(parsed.safetyActions)
        ? parsed.safetyActions
        : [],
      blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(
  tenantSlug: string,
  store: GovernanceStore,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2));
}

export async function loadGovernanceStore(
  tenantId: string,
): Promise<GovernanceStore> {
  const slug = resolveTenantPublicId(tenantId);
  const cached = memory.get(slug);
  if (cached) return cached;
  const fromFile = await readFileStore(slug);
  memory.set(slug, fromFile);
  return fromFile;
}

export async function persistGovernanceStore(
  tenantId: string,
  store: GovernanceStore,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  memory.set(slug, store);
  if (isFilePersistenceAllowed()) {
    await writeFileStore(slug, store);
  }
}

export async function replaceGovernanceStoreForTests(
  tenantId: string,
  store: GovernanceStore = emptyStore(),
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  memory.set(slug, {
    rules: [...store.rules],
    reports: [...store.reports],
    safetyActions: [...store.safetyActions],
    blocks: [...store.blocks],
  });
  if (isFilePersistenceAllowed()) {
    await writeFileStore(slug, memory.get(slug)!);
  }
}
