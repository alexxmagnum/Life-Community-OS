/**
 * Personal intelligence store — private to the Person.
 * Not a recommendation domain. File fixture in development only.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  emptyPersonalContext,
  favoriteLocationsFrom,
  isPersonalFavoriteKind,
  mergePersonalPrivacy,
  personalFavoriteId,
  sanitizeInterestIds,
  type PersonalContext,
  type PersonalFavorite,
  type PersonalFavoriteKind,
  type PersonalParticipationHistoryItem,
  type PersonalPrivacy,
} from "@life-community-os/types";
import {
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export type PersonalWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

type PersonalStore = {
  contexts: PersonalContext[];
  favorites: PersonalFavorite[];
  deliveredInsightIds: string[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "personal");
const memory = new Map<string, PersonalStore>();

function emptyStore(): PersonalStore {
  return { contexts: [], favorites: [], deliveredInsightIds: [] };
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

async function readFileStore(tenantSlug: string): Promise<PersonalStore> {
  if (!isFilePersistenceAllowed()) return emptyStore();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<PersonalStore>;
    return {
      contexts: Array.isArray(parsed.contexts) ? parsed.contexts : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      deliveredInsightIds: Array.isArray(parsed.deliveredInsightIds)
        ? parsed.deliveredInsightIds
        : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(
  tenantSlug: string,
  store: PersonalStore,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2));
}

async function loadStore(tenantId: string): Promise<PersonalStore> {
  const slug = resolveTenantPublicId(tenantId);
  const cached = memory.get(slug);
  if (cached) return cached;
  const fromFile = await readFileStore(slug);
  memory.set(slug, fromFile);
  return fromFile;
}

async function persistStore(
  tenantId: string,
  store: PersonalStore,
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  memory.set(slug, store);
  if (isFilePersistenceAllowed()) {
    await writeFileStore(slug, store);
  }
}

export async function getPersonalContextServer(input: {
  tenantId: string;
  personId: string;
  territoryId: string;
  participationHistory?: PersonalParticipationHistoryItem[];
}): Promise<PersonalContext> {
  const store = await loadStore(input.tenantId);
  const existing = store.contexts.find(
    (row) =>
      row.personId === input.personId && row.tenantId === input.tenantId,
  );
  const favorites = store.favorites.filter(
    (row) =>
      row.personId === input.personId && row.tenantId === input.tenantId,
  );
  const base =
    existing ??
    emptyPersonalContext({
      personId: input.personId,
      tenantId: input.tenantId,
      territoryId: input.territoryId,
    });
  return {
    ...base,
    tenantId: input.tenantId,
    personId: input.personId,
    territoryId: input.territoryId,
    favoriteLocations: favoriteLocationsFrom(favorites),
    participationHistory: input.participationHistory ?? base.participationHistory,
  };
}

export async function listPersonalFavoritesServer(input: {
  tenantId: string;
  personId: string;
}): Promise<PersonalFavorite[]> {
  const store = await loadStore(input.tenantId);
  return store.favorites.filter(
    (row) =>
      row.personId === input.personId && row.tenantId === input.tenantId,
  );
}

export async function patchPersonalContextServer(input: {
  tenantId: string;
  personId: string;
  territoryId: string;
  interests?: string[];
  categories?: string[];
  privacy?: Partial<PersonalPrivacy>;
  participationHistory?: PersonalParticipationHistoryItem[];
}): Promise<PersonalContext> {
  const store = await loadStore(input.tenantId);
  const current = await getPersonalContextServer(input);
  const next: PersonalContext = {
    ...current,
    preferences: {
      categories: input.categories
        ? input.categories.map((item) => item.trim()).filter(Boolean)
        : current.preferences.categories,
      interests: input.interests
        ? sanitizeInterestIds(input.interests)
        : current.preferences.interests,
    },
    privacy: input.privacy
      ? mergePersonalPrivacy({ ...current.privacy, ...input.privacy })
      : current.privacy,
    participationHistory:
      input.participationHistory ?? current.participationHistory,
  };
  const index = store.contexts.findIndex(
    (row) => row.personId === input.personId && row.tenantId === input.tenantId,
  );
  if (index >= 0) store.contexts[index] = next;
  else store.contexts.push(next);
  await persistStore(input.tenantId, store);
  return getPersonalContextServer(input);
}

export async function togglePersonalFavoriteServer(input: {
  tenantId: string;
  personId: string;
  kind: string;
  targetId: string;
}): Promise<{ favorite: PersonalFavorite | null; saved: boolean }> {
  if (!isPersonalFavoriteKind(input.kind)) {
    return { favorite: null, saved: false };
  }
  const kind: PersonalFavoriteKind = input.kind;
  const targetId = input.targetId.trim();
  if (!targetId) return { favorite: null, saved: false };
  const store = await loadStore(input.tenantId);
  const existing = store.favorites.find(
    (row) =>
      row.personId === input.personId &&
      row.tenantId === input.tenantId &&
      row.kind === kind &&
      row.targetId === targetId,
  );
  if (existing) {
    store.favorites = store.favorites.filter((row) => row.id !== existing.id);
    await persistStore(input.tenantId, store);
    return { favorite: null, saved: false };
  }
  const favorite: PersonalFavorite = {
    id: personalFavoriteId(input.personId, kind, targetId),
    tenantId: input.tenantId,
    personId: input.personId,
    kind,
    targetId,
  };
  store.favorites.push(favorite);
  await persistStore(input.tenantId, store);
  return { favorite, saved: true };
}

function deliveredInsightKey(personId: string, insightId: string): string {
  return `${personId}::${insightId}`;
}

export async function markInsightsDeliveredServer(input: {
  tenantId: string;
  personId: string;
  ids: readonly string[];
}): Promise<void> {
  const store = await loadStore(input.tenantId);
  const next = new Set(store.deliveredInsightIds);
  for (const id of input.ids) next.add(deliveredInsightKey(input.personId, id));
  store.deliveredInsightIds = [...next];
  await persistStore(input.tenantId, store);
}

export async function listDeliveredInsightIdsServer(input: {
  tenantId: string;
  personId: string;
}): Promise<string[]> {
  const store = await loadStore(input.tenantId);
  const prefix = `${input.personId}::`;
  return store.deliveredInsightIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => id.slice(prefix.length));
}

export async function replacePersonalStoreForTests(
  tenantId: string,
  store: PersonalStore = emptyStore(),
): Promise<void> {
  const slug = resolveTenantPublicId(tenantId);
  memory.set(slug, {
    contexts: [...store.contexts],
    favorites: [...store.favorites],
    deliveredInsightIds: [...store.deliveredInsightIds],
  });
  if (isFilePersistenceAllowed()) {
    await writeFileStore(slug, memory.get(slug)!);
  }
}
