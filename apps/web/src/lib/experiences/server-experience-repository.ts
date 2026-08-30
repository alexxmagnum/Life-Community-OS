/**
 * Experience repository — Territory-owned domain.
 *
 * Production: PostgreSQL experiences + experience_participants.
 * Tests / dev fixture: apps/web/.data/experiences when LCOS_EXPERIENCE_FIXTURE=1.
 * Owner is the session Person. Client owner ids are ignored.
 * Catalog packs are never the Experience source of truth.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createExperienceParticipationRecord,
  createExperienceRecord,
  isExperienceLifecycleStatus,
  participationOccupiesSeat,
  hhmmToMinutes,
  minutesToHhmm,
  recordMatchesTerritoryScope,
  splitIsoToDateTime,
  type ExperienceLifecycleStatus,
  type ExperienceParticipation,
  type ExperienceRecord,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  PersistenceUnavailableError,
} from "@/lib/data/data-plane";
import { createDomainDatabaseClient } from "@/lib/data/database-access";
import {
  listTerritoryUuidsForTenant,
  resolveTenantPublicId,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import {
  asTerritoryUuid,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";
import {
  createReservationServer,
  getResourceServer,
  updateReservationServer,
} from "@/lib/reservations/server-reservations-repository";

export type ExperienceWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

type ExperienceFixtureStore = {
  experiences: ExperienceRecord[];
  participants: ExperienceParticipation[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "experiences");

function fixtureEnabled(): boolean {
  return process.env.LCOS_EXPERIENCE_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

function emptyStore(): ExperienceFixtureStore {
  return { experiences: [], participants: [] };
}

function assertTerritoryOwnedByTenant(
  tenantId: string,
  territoryId: string,
): void {
  const allowed = listTerritoryUuidsForTenant(tenantId);
  if (allowed.length > 0 && !allowed.includes(territoryId)) {
    throw new Error("cross_territory_forbidden");
  }
}

function occupyingCount(
  participants: ExperienceParticipation[],
  experienceId: string,
): number {
  return participants.filter(
    (item) =>
      item.experienceId === experienceId && participationOccupiesSeat(item.role),
  ).length;
}

function slotFromExperience(experience: ExperienceRecord): {
  date: string;
  start: string;
  end: string;
} {
  const start = splitIsoToDateTime(experience.startsAt);
  if (experience.endsAt) {
    const end = splitIsoToDateTime(experience.endsAt);
    return { date: start.date, start: start.start, end: end.start };
  }
  return {
    date: start.date,
    start: start.start,
    end: minutesToHhmm(hhmmToMinutes(start.start) + 60),
  };
}

async function readFileStore(
  tenantSlug: string,
): Promise<ExperienceFixtureStore> {
  if (!isFilePersistenceAllowed()) return emptyStore();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as ExperienceFixtureStore;
    return {
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(
  tenantSlug: string,
  store: ExperienceFixtureStore,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2));
}

type ExperienceRow = {
  id: string;
  tenant_id: string;
  territory_id: string;
  created_by: string;
  owner_person_id: string;
  resource_id: string | null;
  title: string;
  description: string;
  category: string;
  status: ExperienceLifecycleStatus;
  capacity: number;
  schedule_starts_at: string;
  schedule_ends_at: string | null;
  location_label: string;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type ParticipantRow = {
  id: string;
  tenant_id: string;
  experience_id: string;
  person_id: string;
  created_by: string;
  role: ExperienceParticipation["role"];
  reservation_id: string | null;
  created_at: string;
  updated_at: string;
};

function parseMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function rowToExperience(
  row: ExperienceRow,
  tenantSlug: string,
): ExperienceRecord {
  return {
    id: row.id,
    tenantId: tenantSlug,
    territoryId: row.territory_id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    ownerPersonId: row.owner_person_id,
    createdBy: row.created_by,
    ...(row.resource_id ? { resourceId: row.resource_id } : {}),
    startsAt: row.schedule_starts_at,
    ...(row.schedule_ends_at ? { endsAt: row.schedule_ends_at } : {}),
    location: row.location_label ?? "",
    capacity: row.capacity,
    metadata: parseMetadata(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToParticipant(
  row: ParticipantRow,
  tenantSlug: string,
): ExperienceParticipation {
  return {
    id: row.id,
    tenantId: tenantSlug,
    experienceId: row.experience_id,
    personId: row.person_id,
    createdBy: row.created_by,
    role: row.role,
    ...(row.reservation_id ? { reservationId: row.reservation_id } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadStore(
  tenantSlug: string,
  scope?: ExperienceWriteScope,
): Promise<ExperienceFixtureStore> {
  if (fixtureEnabled() && isFilePersistenceAllowed()) {
    return readFileStore(tenantSlug);
  }
  if (!isDatabaseConfigured()) {
    if (!isFilePersistenceAllowed()) {
      throw new PersistenceUnavailableError();
    }
    return readFileStore(tenantSlug);
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return emptyStore();
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    return emptyStore();
  }
  const [experiencesRes, participantsRes] = await Promise.all([
    client.from("experiences").select("*").eq("tenant_id", tenantUuid),
    client
      .from("experience_participants")
      .select("*")
      .eq("tenant_id", tenantUuid),
  ]);
  if (experiencesRes.error) {
    console.warn("[experiences] list failed", experiencesRes.error.message);
    if (isFilePersistenceAllowed()) return readFileStore(tenantSlug);
    throw new PersistenceUnavailableError(experiencesRes.error.message);
  }
  return {
    experiences: ((experiencesRes.data as ExperienceRow[]) ?? []).map((row) =>
      rowToExperience(row, tenantSlug),
    ),
    participants: ((participantsRes.data as ParticipantRow[]) ?? []).map(
      (row) => rowToParticipant(row, tenantSlug),
    ),
  };
}

async function persistStore(
  tenantSlug: string,
  store: ExperienceFixtureStore,
  scope?: ExperienceWriteScope,
): Promise<void> {
  if (fixtureEnabled() && isFilePersistenceAllowed()) {
    await writeFileStore(tenantSlug, store);
    return;
  }
  if (isDatabaseConfigured()) {
    const tenantUuid = tenantSlugToUuid(tenantSlug);
    const client = tenantUuid
      ? await createDomainDatabaseClient(scope)
      : null;
    if (client && tenantUuid) {
      const territoryUuid = (id: string) => asTerritoryUuid(id);
      const experienceRows = store.experiences.map((item) => ({
        id: item.id,
        tenant_id: tenantUuid,
        territory_id: territoryUuid(item.territoryId),
        created_by: item.createdBy,
        owner_person_id: item.ownerPersonId,
        resource_id: item.resourceId ?? null,
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status,
        capacity: item.capacity,
        schedule_starts_at: item.startsAt,
        schedule_ends_at: item.endsAt ?? null,
        location_label: item.location,
        metadata: item.metadata,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));
      const participantRows = store.participants.map((item) => ({
        id: item.id,
        tenant_id: tenantUuid,
        experience_id: item.experienceId,
        person_id: item.personId,
        created_by: item.createdBy,
        role: item.role,
        reservation_id: item.reservationId ?? null,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));
      const expError = experienceRows.length
        ? (await client.from("experiences").upsert(experienceRows)).error
        : null;
      const partError = participantRows.length
        ? (await client.from("experience_participants").upsert(participantRows))
            .error
        : null;
      if (!expError && !partError) return;
      console.warn(
        "[experiences] upsert failed",
        expError?.message ?? partError?.message,
      );
    }
  }
  await writeFileStore(tenantSlug, store);
}

async function assertResourceSameTerritory(input: {
  tenantId: string;
  territoryId: string;
  resourceId?: string;
  scope?: ExperienceWriteScope;
}): Promise<void> {
  const resourceId = input.resourceId?.trim();
  if (!resourceId) return;
  const resource = await getResourceServer(
    input.tenantId,
    resourceId,
    input.scope,
  );
  if (!resource) {
    throw new Error("resource_not_found");
  }
  if (resource.tenantId && resource.tenantId !== input.tenantId) {
    throw new Error("resource_territory_mismatch");
  }
  if (resource.territoryId && resource.territoryId !== input.territoryId) {
    throw new Error("resource_territory_mismatch");
  }
}

async function notifyExperiencePublished(input: {
  tenantId: string;
  personId: string;
  experience: ExperienceRecord;
  publishToCommunity?: boolean;
  displayName?: string;
  scope?: ExperienceWriteScope;
}): Promise<void> {
  try {
    const { createCommunityNotification, createCommunityPost } = await import(
      "@/lib/community/server-community-repository"
    );
    await createCommunityNotification({
      tenantId: input.tenantId,
      recipientPersonId: input.personId,
      kind: "experience_published",
      title: "Nueva actividad",
      body: input.experience.title,
      entityType: "experience",
      entityId: input.experience.id,
      createdBy: input.personId,
      scope: input.scope,
    });
    if (input.publishToCommunity) {
      await createCommunityPost({
        tenantId: input.tenantId,
        authorPersonId: input.personId,
        authorDisplayName: input.displayName?.trim() || "Vecino",
        title: input.experience.title,
        body: input.experience.description,
        kind: "member_update",
        territoryId: input.experience.territoryId,
        scope: input.scope,
      });
    }
  } catch {
    // Experience remains authoritative even if Community notify fails.
  }
}

export async function listExperiencesServer(
  tenantId: string,
  scope?: ExperienceWriteScope,
  query?: { territoryId?: string | null },
): Promise<ExperienceRecord[]> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  const rows = store.experiences.filter((item) => item.tenantId === slug);
  const territoryId = query?.territoryId?.trim();
  if (!territoryId) return rows;
  return rows.filter((item) =>
    recordMatchesTerritoryScope(item.territoryId, territoryId),
  );
}

export async function getExperienceServer(
  tenantId: string,
  experienceId: string,
  scope?: ExperienceWriteScope,
): Promise<ExperienceRecord | null> {
  const all = await listExperiencesServer(tenantId, scope);
  return all.find((item) => item.id === experienceId) ?? null;
}

export async function listExperienceParticipantsServer(
  tenantId: string,
  experienceId: string,
  scope?: ExperienceWriteScope,
): Promise<ExperienceParticipation[]> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  return store.participants.filter((item) => item.experienceId === experienceId);
}

export async function createExperienceServer(input: {
  tenantId: string;
  ownerPersonId: string;
  title: string;
  description: string;
  category?: string;
  status?: ExperienceLifecycleStatus;
  resourceId?: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  capacity?: number;
  territoryId?: string;
  publishToCommunity?: boolean;
  authorDisplayName?: string;
  ownerPersonIdFromClient?: string | null;
  scope?: ExperienceWriteScope;
}): Promise<ExperienceRecord> {
  void input.ownerPersonIdFromClient;
  const slug = resolveTenantPublicId(input.tenantId);
  const territoryId = resolveStampTerritoryId({
    tenantId: slug,
    explicit: input.territoryId,
  });
  if (!territoryId) {
    throw new Error("missing_territory");
  }
  assertTerritoryOwnedByTenant(slug, territoryId);
  await assertResourceSameTerritory({
    tenantId: slug,
    territoryId,
    resourceId: input.resourceId,
    scope: input.scope,
  });
  const experience = createExperienceRecord({
    tenantId: slug,
    territoryId,
    ownerPersonId: input.ownerPersonId,
    createdBy: input.ownerPersonId,
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status,
    resourceId: input.resourceId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    location: input.location,
    capacity: input.capacity,
  });
  const creator = createExperienceParticipationRecord({
    tenantId: slug,
    experienceId: experience.id,
    personId: input.ownerPersonId,
    createdBy: input.ownerPersonId,
    role: "creator",
  });
  const store = await loadStore(slug, input.scope);
  store.experiences = [
    experience,
    ...store.experiences.filter((item) => item.id !== experience.id),
  ];
  store.participants = [
    creator,
    ...store.participants.filter(
      (item) =>
        !(
          item.experienceId === experience.id &&
          item.personId === creator.personId
        ),
    ),
  ];
  await persistStore(slug, store, input.scope);
  if (experience.status === "published") {
    await notifyExperiencePublished({
      tenantId: slug,
      personId: input.ownerPersonId,
      experience,
      publishToCommunity: input.publishToCommunity,
      displayName: input.authorDisplayName,
      scope: input.scope,
    });
  }
  return experience;
}

export async function updateExperienceServer(input: {
  tenantId: string;
  experienceId: string;
  actorPersonId: string;
  canManage: boolean;
  patch: {
    title?: string;
    description?: string;
    category?: string;
    status?: ExperienceLifecycleStatus;
    resourceId?: string | null;
    startsAt?: string;
    endsAt?: string;
    location?: string;
    capacity?: number;
  };
  ownerPersonIdFromClient?: string | null;
  scope?: ExperienceWriteScope;
}): Promise<ExperienceRecord> {
  if (input.ownerPersonIdFromClient) {
    throw new Error("owner_immutable");
  }
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const current = store.experiences.find((item) => item.id === input.experienceId);
  if (!current) throw new Error("not_found");
  const isOwner =
    input.actorPersonId === current.ownerPersonId ||
    input.actorPersonId === current.createdBy;
  if (!isOwner && !input.canManage) {
    throw new Error("forbidden");
  }
  const nextResourceId =
    input.patch.resourceId === undefined
      ? current.resourceId
      : input.patch.resourceId?.trim() || undefined;
  await assertResourceSameTerritory({
    tenantId: slug,
    territoryId: current.territoryId,
    resourceId: nextResourceId,
    scope: input.scope,
  });
  if (input.patch.status && !isExperienceLifecycleStatus(input.patch.status)) {
    throw new Error("invalid_status");
  }
  const next = createExperienceRecord({
    ...current,
    title: input.patch.title ?? current.title,
    description: input.patch.description ?? current.description,
    category: input.patch.category ?? current.category,
    status: input.patch.status ?? current.status,
    resourceId: nextResourceId,
    startsAt: input.patch.startsAt ?? current.startsAt,
    endsAt: input.patch.endsAt ?? current.endsAt,
    location: input.patch.location ?? current.location,
    capacity: input.patch.capacity ?? current.capacity,
    ownerPersonId: current.ownerPersonId,
    createdBy: current.createdBy,
    id: current.id,
    tenantId: current.tenantId,
    territoryId: current.territoryId,
    metadata: current.metadata,
  });
  next.createdAt = current.createdAt;
  next.updatedAt = new Date().toISOString();
  store.experiences = store.experiences.map((item) =>
    item.id === next.id ? next : item,
  );
  await persistStore(slug, store, input.scope);
  return next;
}

export async function joinExperienceServer(input: {
  tenantId: string;
  experienceId: string;
  personId: string;
  scope?: ExperienceWriteScope;
}): Promise<ExperienceParticipation> {
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const experience = store.experiences.find(
    (item) => item.id === input.experienceId,
  );
  if (!experience) throw new Error("not_found");
  if (experience.status !== "published") {
    throw new Error("not_joinable");
  }
  const existing = store.participants.find(
    (item) =>
      item.experienceId === experience.id && item.personId === input.personId,
  );
  if (existing && participationOccupiesSeat(existing.role)) {
    throw new Error("already_joined");
  }
  const used = occupyingCount(store.participants, experience.id);
  const full = used >= experience.capacity;
  let reservationId: string | undefined;
  let role: ExperienceParticipation["role"] = full ? "waitlist" : "participant";
  if (!full) {
    try {
      const slot = slotFromExperience(experience);
      const reservation = await createReservationServer({
        tenantId: slug,
        createdBy: input.personId,
        context: { type: "experience", id: experience.id },
        resourceId: experience.resourceId,
        date: slot.date,
        start: slot.start,
        end: slot.end,
        experienceId: experience.id,
        territoryId: experience.territoryId,
        scope: input.scope,
      });
      reservationId = reservation.id;
      role = "participant";
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "slot_unavailable") {
        role = "waitlist";
      } else {
        throw error;
      }
    }
  }
  const participation = createExperienceParticipationRecord({
    tenantId: slug,
    experienceId: experience.id,
    personId: input.personId,
    createdBy: input.personId,
    role,
    reservationId,
    id: existing?.id,
  });
  if (existing) {
    participation.createdAt = existing.createdAt;
  }
  store.participants = [
    participation,
    ...store.participants.filter(
      (item) =>
        !(
          item.experienceId === experience.id &&
          item.personId === input.personId
        ),
    ),
  ];
  await persistStore(slug, store, input.scope);
  return participation;
}

export async function leaveExperienceServer(input: {
  tenantId: string;
  experienceId: string;
  personId: string;
  scope?: ExperienceWriteScope;
}): Promise<ExperienceParticipation> {
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const experience = store.experiences.find(
    (item) => item.id === input.experienceId,
  );
  if (!experience) throw new Error("not_found");
  const existing = store.participants.find(
    (item) =>
      item.experienceId === experience.id && item.personId === input.personId,
  );
  if (!existing) throw new Error("not_found");
  if (existing.role === "creator") {
    throw new Error("creator_cannot_leave");
  }
  if (existing.reservationId) {
    await updateReservationServer({
      tenantId: slug,
      reservationId: existing.reservationId,
      status: "cancelled",
      scope: input.scope,
    });
  }
  const next: ExperienceParticipation = {
    ...existing,
    role: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  store.participants = store.participants.map((item) =>
    item.id === next.id ? next : item,
  );
  await persistStore(slug, store, input.scope);
  return next;
}

export async function cancelExperienceServer(input: {
  tenantId: string;
  experienceId: string;
  actorPersonId: string;
  canManage: boolean;
  scope?: ExperienceWriteScope;
}): Promise<ExperienceRecord> {
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const current = store.experiences.find((item) => item.id === input.experienceId);
  if (!current) throw new Error("not_found");
  const isOwner =
    input.actorPersonId === current.ownerPersonId ||
    input.actorPersonId === current.createdBy;
  if (!isOwner && !input.canManage) {
    throw new Error("forbidden");
  }
  const next: ExperienceRecord = {
    ...current,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  store.experiences = store.experiences.map((item) =>
    item.id === next.id ? next : item,
  );
  const linked = store.participants.filter(
    (item) => item.experienceId === current.id && item.reservationId,
  );
  for (const participant of linked) {
    if (!participant.reservationId) continue;
    await updateReservationServer({
      tenantId: slug,
      reservationId: participant.reservationId,
      status: "cancelled",
      scope: input.scope,
    });
  }
  store.participants = store.participants.map((item) =>
    item.experienceId === current.id && participationOccupiesSeat(item.role)
      ? { ...item, role: "cancelled" as const, updatedAt: next.updatedAt }
      : item,
  );
  await persistStore(slug, store, input.scope);
  return next;
}

export async function replaceExperienceStoreForTests(
  tenantId: string,
  store: ExperienceFixtureStore = emptyStore(),
): Promise<void> {
  if (!isFilePersistenceAllowed()) return;
  await writeFileStore(resolveTenantPublicId(tenantId), store);
}
