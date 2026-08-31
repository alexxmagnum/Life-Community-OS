/**
 * Resource + Reservation repository.
 *
 * Production: PostgreSQL resources / resource_availability / reservations.
 * Tests / dev fixture: apps/web/.data/reservations when LCOS_RESERVATIONS_FIXTURE=1.
 * created_by is assigned from the session actor. Client owner ids are ignored.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createBookableResourceRecord,
  createReservationContext,
  createReservationParticipantRecord,
  createReservationRecord,
  generateResourceAvailability,
  hhmmToMinutes,
  isReservationStatus,
  minutesToHhmm,
  reservationContextOf,
  resourceIsBookable,
  splitIsoToDateTime,
  usedCapacityForContext,
  usedCapacityForInterval,
  withReservationLifecycle,
  type CommunityResource,
  type Reservation,
  type ReservationContext,
  type ReservationContextType,
  type ReservationParticipant,
  type ReservationStatus,
  type ResourceAvailability,
  type ResourceCategory,
  type TimeSlot,
} from "@life-community-os/types";
import {
  isDatabaseConfigured,
  isFilePersistenceAllowed,
  isProductionDataPlane,
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
  activityFromPackExperience,
  resourceFromPackItem,
} from "./seed-from-pack";

export type ReservationsWriteScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export type ReservationsStore = {
  resources: CommunityResource[];
  availability: ResourceAvailability[];
  reservations: Reservation[];
  participants: ReservationParticipant[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "reservations");

function fixtureEnabled(): boolean {
  return process.env.LCOS_RESERVATIONS_FIXTURE === "1";
}

function filePath(tenantSlug: string): string {
  return path.join(DATA_DIR, `${tenantSlug}.json`);
}

function emptyStore(): ReservationsStore {
  return {
    resources: [],
    availability: [],
    reservations: [],
    participants: [],
  };
}

async function fileExists(tenantSlug: string): Promise<boolean> {
  try {
    await fs.access(filePath(tenantSlug));
    return true;
  } catch {
    return false;
  }
}

async function readFileStore(tenantSlug: string): Promise<ReservationsStore> {
  if (!isFilePersistenceAllowed()) return emptyStore();
  try {
    const raw = await fs.readFile(filePath(tenantSlug), "utf8");
    const parsed = JSON.parse(raw) as Partial<ReservationsStore>;
    return {
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      availability: Array.isArray(parsed.availability) ? parsed.availability : [],
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(
  tenantSlug: string,
  store: ReservationsStore,
): Promise<void> {
  if (!isFilePersistenceAllowed()) {
    throw new PersistenceUnavailableError();
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath(tenantSlug), JSON.stringify(store, null, 2));
}

export async function replaceReservationsStoreForTests(
  tenantSlug: string,
  store: ReservationsStore = emptyStore(),
): Promise<void> {
  await writeFileStore(tenantSlug, store);
}

type ResourceRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  location_id: string | null;
  territory_id: string | null;
  name: string;
  category: ResourceCategory;
  description: string;
  images: unknown;
  status: CommunityResource["status"];
  booking_rules: unknown;
  resource_type: CommunityResource["type"];
  owner_kind: CommunityResource["ownerKind"];
  owner_id: string;
  bookable: boolean;
  slot_minutes: number;
  capacity: number;
  requires_approval: boolean;
  location_label: string;
  area_label: string | null;
  linked_resource_id: string | null;
  schedule_starts_at: string | null;
  schedule_ends_at: string | null;
  community_event_id: string | null;
  organizer_name: string | null;
  created_at: string;
  updated_at: string;
};

type AvailabilityRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  resource_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  status: ResourceAvailability["status"];
  created_at: string;
  updated_at: string;
};

type ReservationRow = {
  id: string;
  tenant_id: string;
  territory_id: string | null;
  created_by: string;
  resource_id: string | null;
  context_type: ReservationContextType | null;
  context_id: string | null;
  participant_count: number;
  capacity: number | null;
  metadata: unknown;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  experience_id: string | null;
  slot_date: string;
  start_hhmm: string;
  end_hhmm: string;
  resource_name: string | null;
  resource_image_url: string | null;
  location_label: string | null;
  area_label: string | null;
  created_at: string;
  updated_at: string;
};

type ParticipantRow = {
  id: string;
  tenant_id: string;
  created_by: string;
  reservation_id: string;
  person_id: string;
  role: ReservationParticipant["role"] | null;
  created_at: string;
  updated_at: string;
};

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function rowToResource(row: ResourceRow, tenantSlug: string): CommunityResource {
  const images = parseStringList(row.images);
  const rules = parseStringList(row.booking_rules);
  return {
    id: row.id,
    tenantId: tenantSlug,
    createdBy: row.created_by,
    name: row.name,
    description: row.description,
    imageUrl: images[0],
    images,
    location: row.location_label,
    areaLabel: row.area_label ?? undefined,
    locationId: row.location_id ?? undefined,
    type: row.resource_type,
    category: row.category,
    ownerKind: row.owner_kind,
    ownerId: row.owner_id,
    bookable: row.bookable,
    status: row.status,
    rules,
    bookingRules: rules,
    slotMinutes: row.slot_minutes,
    capacity: row.capacity,
    requiresApproval: row.requires_approval,
    linkedResourceId: row.linked_resource_id ?? undefined,
    scheduleStartsAt: row.schedule_starts_at ?? undefined,
    scheduleEndsAt: row.schedule_ends_at ?? undefined,
    communityEventId: row.community_event_id ?? undefined,
    organizerName: row.organizer_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.territory_id ? { territoryId: row.territory_id } : {}),
  };
}

function rowToAvailability(
  row: AvailabilityRow,
  tenantSlug: string,
): ResourceAvailability {
  return {
    id: row.id,
    tenantId: tenantSlug,
    resourceId: row.resource_id,
    createdBy: row.created_by,
    date: String(row.slot_date).slice(0, 10),
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function rowToReservation(row: ReservationRow, tenantSlug: string): Reservation {
  const resourceId = row.resource_id?.trim() || undefined;
  const experienceId = row.experience_id ?? undefined;
  const contextType = row.context_type ?? undefined;
  const contextId = row.context_id ?? undefined;
  return {
    id: row.id,
    tenantId: tenantSlug,
    ...(resourceId ? { resourceId } : {}),
    ...(contextType ? { contextType } : {}),
    ...(contextId ? { contextId } : {}),
    createdBy: row.created_by,
    personId: row.created_by,
    participantCount: row.participant_count,
    ...(row.capacity && row.capacity > 0 ? { capacity: row.capacity } : {}),
    metadata: parseMetadata(row.metadata),
    startTime: row.start_time,
    endTime: row.end_time,
    date: String(row.slot_date).slice(0, 10),
    start: row.start_hhmm,
    end: row.end_hhmm,
    status: row.status,
    experienceId,
    resourceName: row.resource_name ?? undefined,
    resourceImageUrl: row.resource_image_url ?? undefined,
    location: row.location_label ?? undefined,
    areaLabel: row.area_label ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.territory_id ? { territoryId: row.territory_id } : {}),
  };
}

function rowToParticipant(
  row: ParticipantRow,
  tenantSlug: string,
): ReservationParticipant {
  return {
    id: row.id,
    tenantId: tenantSlug,
    reservationId: row.reservation_id,
    personId: row.person_id,
    createdBy: row.created_by,
    role: row.role ?? "participant",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function seedFromPackIfEmpty(
  tenantSlug: string,
  store: ReservationsStore,
): Promise<ReservationsStore> {
  if (isProductionDataPlane()) return store;
  if (!isFilePersistenceAllowed()) return store;
  if (store.resources.length > 0) return store;
  try {
    const { requireTenantPack } = await import("@/lib/tenant/registry");
    const pack = requireTenantPack(tenantSlug);
    const resourceSeed = pack.getCatalogSeed("resources") as PackLike[];
    const experienceSeed = pack.getCatalogSeed("experiences") as PackLike[];
    const resources: CommunityResource[] = [];
    for (const item of resourceSeed) {
      const mapped = resourceFromPackItem(tenantSlug, item);
      if (mapped) resources.push(mapped);
    }
    for (const item of experienceSeed) {
      const mapped = activityFromPackExperience(tenantSlug, {
        id: stringField(item, "id"),
        title: stringField(item, "title"),
        description: stringField(item, "description"),
        imageUrl: stringField(item, "imageUrl"),
        location: stringField(item, "location"),
        areaLabel: stringField(item, "areaLabel"),
        startsAt: stringField(item, "startsAt"),
        endsAt: stringField(item, "endsAt"),
        capacity: numberField(item, "capacity"),
        resourceId: stringField(item, "resourceId"),
        organizer: {
          name: nestedName(item),
        },
      });
      if (mapped) resources.push(mapped);
    }
    const availability = resources.flatMap((resource) =>
      generateResourceAvailability({
        resource,
        createdBy: resource.createdBy ?? "system-seed",
      }),
    );
    const next = { ...store, resources, availability };
    await writeFileStore(tenantSlug, next);
    return next;
  } catch {
    return store;
  }
}

type PackLike = Record<string, unknown>;

function stringField(item: PackLike, key: string): string | undefined {
  const value = item[key];
  return typeof value === "string" ? value : undefined;
}

function numberField(item: PackLike, key: string): number | undefined {
  const value = item[key];
  return typeof value === "number" ? value : undefined;
}

function nestedName(item: PackLike): string | undefined {
  const organizer = item.organizer;
  if (organizer && typeof organizer === "object" && "name" in organizer) {
    const name = (organizer as { name?: unknown }).name;
    return typeof name === "string" ? name : undefined;
  }
  return undefined;
}

async function loadStore(
  tenantSlug: string,
  scope?: ReservationsWriteScope,
): Promise<ReservationsStore> {
  if (fixtureEnabled() && isFilePersistenceAllowed()) {
    if (await fileExists(tenantSlug)) return readFileStore(tenantSlug);
    return seedFromPackIfEmpty(tenantSlug, emptyStore());
  }
  if (!isDatabaseConfigured()) {
    if (!isFilePersistenceAllowed()) throw new PersistenceUnavailableError();
    if (await fileExists(tenantSlug)) return readFileStore(tenantSlug);
    return seedFromPackIfEmpty(tenantSlug, emptyStore());
  }
  const tenantUuid = tenantSlugToUuid(tenantSlug);
  if (!tenantUuid) return emptyStore();
  const client = await createDomainDatabaseClient(scope);
  if (!client) {
    if (isFilePersistenceAllowed()) {
      return seedFromPackIfEmpty(tenantSlug, await readFileStore(tenantSlug));
    }
    return emptyStore();
  }
  const [resourcesRes, availabilityRes, reservationsRes, participantsRes] =
    await Promise.all([
      client.from("resources").select("*").eq("tenant_id", tenantUuid),
      client.from("resource_availability").select("*").eq("tenant_id", tenantUuid),
      client.from("reservations").select("*").eq("tenant_id", tenantUuid),
      client
        .from("reservation_participants")
        .select("*")
        .eq("tenant_id", tenantUuid),
    ]);
  if (resourcesRes.error) {
    console.warn("[reservations] list failed", resourcesRes.error.message);
    if (isFilePersistenceAllowed()) {
      return seedFromPackIfEmpty(tenantSlug, await readFileStore(tenantSlug));
    }
    throw new PersistenceUnavailableError(resourcesRes.error.message);
  }
  return {
    resources: ((resourcesRes.data ?? []) as ResourceRow[]).map((row) =>
      rowToResource(row, tenantSlug),
    ),
    availability: ((availabilityRes.data ?? []) as AvailabilityRow[]).map((row) =>
      rowToAvailability(row, tenantSlug),
    ),
    reservations: ((reservationsRes.data ?? []) as ReservationRow[]).map((row) =>
      rowToReservation(row, tenantSlug),
    ),
    participants: ((participantsRes.data ?? []) as ParticipantRow[]).map((row) =>
      rowToParticipant(row, tenantSlug),
    ),
  };
}

async function persistStore(
  tenantSlug: string,
  store: ReservationsStore,
  scope?: ReservationsWriteScope,
): Promise<void> {
  if (fixtureEnabled() && isFilePersistenceAllowed()) {
    await writeFileStore(tenantSlug, store);
    return;
  }
  if (isDatabaseConfigured()) {
    const tenantUuid = tenantSlugToUuid(tenantSlug);
    const client = tenantUuid ? await createDomainDatabaseClient(scope) : null;
    if (client && tenantUuid) {
      const resourceRows = store.resources.map((resource) => ({
        id: resource.id,
        tenant_id: tenantUuid,
        created_by: resource.createdBy ?? "unknown",
        location_id: resource.locationId ?? null,
        territory_id: asTerritoryUuid(resource.territoryId),
        name: resource.name,
        category: resource.category ?? "facility",
        description: resource.description,
        images: resource.images ?? (resource.imageUrl ? [resource.imageUrl] : []),
        status: resource.status,
        booking_rules: resource.bookingRules ?? resource.rules ?? [],
        resource_type: resource.type,
        owner_kind: resource.ownerKind,
        owner_id: resource.ownerId,
        bookable: resource.bookable,
        slot_minutes: resource.slotMinutes ?? 60,
        capacity: resource.capacity ?? 1,
        requires_approval: Boolean(resource.requiresApproval),
        location_label: resource.location,
        area_label: resource.areaLabel ?? null,
        linked_resource_id: resource.linkedResourceId ?? null,
        schedule_starts_at: resource.scheduleStartsAt ?? null,
        schedule_ends_at: resource.scheduleEndsAt ?? null,
        community_event_id: resource.communityEventId ?? null,
        organizer_name: resource.organizerName ?? null,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      }));
      const availabilityRows = store.availability.map((slot) => ({
        id: slot.id,
        tenant_id: tenantUuid,
        created_by: slot.createdBy,
        resource_id: slot.resourceId,
        slot_date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        capacity: slot.capacity,
        status: slot.status,
        created_at: slot.createdAt,
        updated_at: slot.updatedAt,
      }));
      const reservationRows = store.reservations.map((item) => {
        const context = (() => {
          try {
            return reservationContextOf(item);
          } catch {
            return {
              type: "resource" as const,
              id: item.resourceId ?? "",
            };
          }
        })();
        return {
          id: item.id,
          tenant_id: tenantUuid,
          territory_id: asTerritoryUuid(item.territoryId),
          created_by: item.createdBy ?? item.personId ?? "unknown",
          resource_id: item.resourceId ?? null,
          context_type: context.type,
          context_id: context.id,
          participant_count: item.participantCount ?? 1,
          capacity: item.capacity ?? null,
          metadata: item.metadata ?? {},
          start_time: item.startTime,
          end_time: item.endTime,
          status: item.status,
          experience_id: item.experienceId ?? null,
          slot_date: item.date,
          start_hhmm: item.start,
          end_hhmm: item.end,
          resource_name: item.resourceName ?? null,
          resource_image_url: item.resourceImageUrl ?? null,
          location_label: item.location ?? null,
          area_label: item.areaLabel ?? null,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        };
      });
      const participantRows = store.participants.map((item) => ({
        id: item.id,
        tenant_id: tenantUuid,
        created_by: item.createdBy,
        reservation_id: item.reservationId,
        person_id: item.personId,
        role: item.role ?? "participant",
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      }));
      const writes = await Promise.all([
        resourceRows.length
          ? client.from("resources").upsert(resourceRows)
          : { error: null },
        availabilityRows.length
          ? client.from("resource_availability").upsert(availabilityRows)
          : { error: null },
        reservationRows.length
          ? client.from("reservations").upsert(reservationRows)
          : { error: null },
        participantRows.length
          ? client.from("reservation_participants").upsert(participantRows)
          : { error: null },
      ]);
      const failed = writes.find((item) => item.error);
      if (!failed?.error) return;
      console.warn("[reservations] upsert failed", failed.error.message);
    }
  }
  await writeFileStore(tenantSlug, store);
}

function occupyingReservations(
  store: ReservationsStore,
  resourceId: string,
): Reservation[] {
  return store.reservations.filter((item) => {
    if (item.resourceId === resourceId) return true;
    try {
      const context = reservationContextOf(item);
      if (context.type === "resource" && context.id === resourceId) return true;
    } catch {
      /* legacy row without context */
    }
    const source = item.resourceId
      ? store.resources.find((row) => row.id === item.resourceId)
      : undefined;
    return source?.linkedResourceId === resourceId;
  });
}

function assertTerritoryOwnedByTenant(tenantId: string, territoryId: string): void {
  const allowed = listTerritoryUuidsForTenant(tenantId);
  if (allowed.length > 0 && !allowed.includes(territoryId)) {
    throw new Error("territory_context_mismatch");
  }
}

function assertSameTerritory(
  left?: string | null,
  right?: string | null,
): void {
  if (left && right && left !== right) {
    throw new Error("territory_context_mismatch");
  }
}

function slotFromSchedule(startsAt: string, endsAt?: string): {
  date: string;
  start: string;
  end: string;
} {
  const start = splitIsoToDateTime(startsAt);
  if (endsAt) {
    const end = splitIsoToDateTime(endsAt);
    return { date: start.date, start: start.start, end: end.start };
  }
  return {
    date: start.date,
    start: start.start,
    end: minutesToHhmm(hhmmToMinutes(start.start) + 60),
  };
}

function resolveInputContext(input: {
  context?: { type?: string; id?: string };
  resourceId?: string;
  experienceId?: string;
}): ReservationContext {
  if (input.context?.type && input.context.id) {
    return createReservationContext({
      type: input.context.type,
      id: input.context.id,
    });
  }
  if (input.experienceId?.trim() && !input.resourceId) {
    return createReservationContext({
      type: "experience",
      id: input.experienceId,
    });
  }
  if (input.resourceId?.trim()) {
    return createReservationContext({
      type: "resource",
      id: input.resourceId,
    });
  }
  throw new Error("missing_context");
}

function usedCapacity(
  store: ReservationsStore,
  resourceId: string,
  date: string,
  start: string,
  end: string,
): number {
  const direct = store.reservations.filter((item) => item.resourceId === resourceId);
  const directUsed = usedCapacityForInterval({
    reservations: direct,
    resourceId,
    date,
    start,
    end,
  });
  const linkedActivityIds = new Set<string>();
  for (const item of occupyingReservations(store, resourceId)) {
    if (item.resourceId === resourceId) continue;
    const source = store.resources.find((row) => row.id === item.resourceId);
    if (!source || source.linkedResourceId !== resourceId) continue;
    const probe: Reservation = { ...item, resourceId };
    const used = usedCapacityForInterval({
      reservations: [probe],
      resourceId,
      date,
      start,
      end,
    });
    if (used > 0) linkedActivityIds.add(source.id);
  }
  return directUsed + linkedActivityIds.size;
}

function slotCapacity(
  store: ReservationsStore,
  resource: CommunityResource,
  date: string,
  start: string,
  end: string,
): number {
  const slot = store.availability.find(
    (item) =>
      item.resourceId === resource.id &&
      item.date === date &&
      item.startTime === start &&
      item.endTime === end,
  );
  if (slot) {
    if (slot.status === "blocked") return 0;
    return slot.capacity;
  }
  return resource.capacity && resource.capacity > 0 ? resource.capacity : 1;
}

async function notifyReservationConfirmed(input: {
  tenantId: string;
  personId: string;
  reservation: Reservation;
  scope?: ReservationsWriteScope;
}): Promise<void> {
  try {
    const { createCommunityNotification } = await import(
      "@/lib/community/server-community-repository"
    );
    await createCommunityNotification({
      tenantId: input.tenantId,
      recipientPersonId: input.personId,
      kind: "mention",
      title: "Reserva confirmada",
      body: input.reservation.resourceName
        ? `Tu reserva de ${input.reservation.resourceName} está confirmada.`
        : "Tu reserva está confirmada.",
      entityType: "event",
      entityId: input.reservation.id,
      createdBy: input.personId,
      scope: input.scope,
    });
  } catch {
    /* Community Core is optional for reservations writes. */
  }
}

async function linkCommunityEvent(input: {
  tenantId: string;
  resource: CommunityResource;
  createdBy: string;
  displayName: string;
  scope?: ReservationsWriteScope;
}): Promise<string | undefined> {
  if (input.resource.category !== "activity") return undefined;
  try {
    const { createCommunityEvent } = await import(
      "@/lib/community/server-community-repository"
    );
    const event = await createCommunityEvent({
      tenantId: input.tenantId,
      authorPersonId: input.createdBy,
      authorDisplayName: input.displayName,
      title: input.resource.name,
      description: input.resource.description,
      startsAt: input.resource.scheduleStartsAt ?? new Date().toISOString(),
      locationLabel: input.resource.location,
      scope: input.scope,
    });
    return event.id;
  } catch {
    return undefined;
  }
}

export async function listResourcesServer(
  tenantId: string,
  scope?: ReservationsWriteScope,
): Promise<CommunityResource[]> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  return store.resources.filter((item) => item.tenantId === slug);
}

export async function getResourceServer(
  tenantId: string,
  resourceId: string,
  scope?: ReservationsWriteScope,
): Promise<CommunityResource | null> {
  const all = await listResourcesServer(tenantId, scope);
  return all.find((item) => item.id === resourceId) ?? null;
}

export async function createResourceServer(input: {
  tenantId: string;
  createdBy: string;
  name: string;
  description: string;
  category: ResourceCategory;
  location?: string;
  areaLabel?: string;
  locationId?: string;
  images?: string[];
  bookingRules?: string[];
  slotMinutes?: number;
  capacity?: number;
  requiresApproval?: boolean;
  linkedResourceId?: string;
  scheduleStartsAt?: string;
  scheduleEndsAt?: string;
  organizerName?: string;
  territoryId?: string;
  createdByFromClient?: string | null;
  scope?: ReservationsWriteScope;
}): Promise<CommunityResource> {
  void input.createdByFromClient;
  const slug = resolveTenantPublicId(input.tenantId);
  const resource = createBookableResourceRecord({
    tenantId: slug,
    createdBy: input.createdBy,
    name: input.name,
    description: input.description,
    category: input.category,
    location: input.location,
    areaLabel: input.areaLabel,
    locationId: input.locationId,
    images: input.images,
    bookingRules: input.bookingRules,
    slotMinutes: input.slotMinutes,
    capacity: input.capacity,
    requiresApproval: input.requiresApproval,
    linkedResourceId: input.linkedResourceId,
    scheduleStartsAt: input.scheduleStartsAt,
    scheduleEndsAt: input.scheduleEndsAt,
    organizerName: input.organizerName,
    territoryId: resolveStampTerritoryId({
      tenantId: slug,
      explicit: input.territoryId,
    }),
  });
  const eventId = await linkCommunityEvent({
    tenantId: slug,
    resource,
    createdBy: input.createdBy,
    displayName: input.organizerName?.trim() || "Vecino",
    scope: input.scope,
  });
  if (eventId) resource.communityEventId = eventId;
  const slots = generateResourceAvailability({
    resource,
    createdBy: input.createdBy,
  });
  const store = await loadStore(slug, input.scope);
  store.resources = [resource, ...store.resources.filter((item) => item.id !== resource.id)];
  store.availability = [
    ...store.availability.filter((item) => item.resourceId !== resource.id),
    ...slots,
  ];
  await persistStore(slug, store, input.scope);
  return resource;
}

export async function updateResourceServer(input: {
  tenantId: string;
  resourceId: string;
  name?: string;
  description?: string;
  status?: CommunityResource["status"];
  scope?: ReservationsWriteScope;
}): Promise<CommunityResource | null> {
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const index = store.resources.findIndex((item) => item.id === input.resourceId);
  if (index < 0) return null;
  const current = store.resources[index]!;
  const next: CommunityResource = {
    ...current,
    name: input.name?.trim() || current.name,
    description: input.description?.trim() || current.description,
    status: input.status ?? current.status,
  };
  store.resources[index] = next;
  await persistStore(slug, store, input.scope);
  return next;
}

export async function listAvailabilityServer(
  tenantId: string,
  resourceId: string,
  date: string | undefined,
  scope?: ReservationsWriteScope,
): Promise<TimeSlot[]> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  const resource = store.resources.find((item) => item.id === resourceId);
  if (!resource) return [];
  let rows = store.availability.filter((item) => item.resourceId === resourceId);
  if (rows.length === 0) {
    rows = generateResourceAvailability({
      resource,
      createdBy: resource.createdBy ?? "system",
      days: 7,
    });
  }
  const selectedDate = date ?? rows[0]?.date;
  const dayRows = selectedDate
    ? rows.filter((item) => item.date === selectedDate)
    : rows;
  return dayRows.map((slot) => {
    const used = usedCapacity(store, resourceId, slot.date, slot.startTime, slot.endTime);
    const occupied =
      slot.status === "blocked" || used >= slot.capacity || !resourceIsBookable(resource);
    return {
      id: slot.id,
      start: slot.startTime,
      end: slot.endTime,
      status: occupied ? ("occupied" as const) : ("available" as const),
    };
  });
}

/**
 * One availability engine for every Reservation Context.
 * Resource / Service: facility slots. Experience with Resource: inherited.
 * Experience / Event without Resource: schedule occupancy vs capacity.
 */
export async function listReservationAvailabilityServer(input: {
  tenantId: string;
  context: { type: string; id: string };
  date?: string;
  scope?: ReservationsWriteScope;
}): Promise<TimeSlot[]> {
  const slug = resolveTenantPublicId(input.tenantId);
  const context = createReservationContext(input.context);
  if (context.type === "resource" || context.type === "service") {
    return listAvailabilityServer(slug, context.id, input.date, input.scope);
  }
  if (context.type === "experience") {
    const { getExperienceServer } = await import(
      "@/lib/experiences/server-experience-repository"
    );
    const experience = await getExperienceServer(slug, context.id, input.scope);
    if (!experience || experience.tenantId !== slug) return [];
    if (experience.resourceId) {
      return listAvailabilityServer(
        slug,
        experience.resourceId,
        input.date,
        input.scope,
      );
    }
    const slot = slotFromSchedule(experience.startsAt, experience.endsAt);
    if (input.date && input.date !== slot.date) return [];
    const store = await loadStore(slug, input.scope);
    const used = usedCapacityForContext({
      reservations: store.reservations,
      context,
      date: slot.date,
      start: slot.start,
      end: slot.end,
    });
    const capacity = experience.capacity > 0 ? experience.capacity : 8;
    return [
      {
        id: `${experience.id}:${slot.date}:${slot.start}`,
        start: slot.start,
        end: slot.end,
        status: used >= capacity ? "occupied" : "available",
      },
    ];
  }
  const { listCommunityEvents } = await import(
    "@/lib/community/server-community-repository"
  );
  const events = await listCommunityEvents(slug, input.scope);
  const event = events.find((item) => item.id === context.id);
  if (!event) return [];
  const slot = slotFromSchedule(event.startsAt, event.endsAt);
  if (input.date && input.date !== slot.date) return [];
  const store = await loadStore(slug, input.scope);
  const used = usedCapacityForContext({
    reservations: store.reservations,
    context,
    date: slot.date,
    start: slot.start,
    end: slot.end,
  });
  return [
    {
      id: `${event.id}:${slot.date}:${slot.start}`,
      start: slot.start,
      end: slot.end,
      status: used >= 1 ? "occupied" : "available",
    },
  ];
}

export async function listReservationsServer(
  tenantId: string,
  scope?: ReservationsWriteScope,
): Promise<Reservation[]> {
  const slug = resolveTenantPublicId(tenantId);
  const store = await loadStore(slug, scope);
  return store.reservations
    .filter((item) => item.tenantId === slug)
    .map((item) => withReservationLifecycle(item));
}

export async function getReservationServer(
  tenantId: string,
  reservationId: string,
  scope?: ReservationsWriteScope,
): Promise<Reservation | null> {
  const all = await listReservationsServer(tenantId, scope);
  return all.find((item) => item.id === reservationId) ?? null;
}

export async function createReservationServer(input: {
  tenantId: string;
  createdBy: string;
  resourceId?: string;
  context?: { type?: string; id?: string };
  date?: string;
  start?: string;
  end?: string;
  participantCount?: number;
  territoryId?: string;
  experienceId?: string;
  createdByFromClient?: string | null;
  scope?: ReservationsWriteScope;
}): Promise<Reservation> {
  void input.createdByFromClient;
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const context = resolveInputContext(input);
  const stampTerritory = resolveStampTerritoryId({
    tenantId: slug,
    explicit: input.territoryId,
  });
  if (stampTerritory) {
    assertTerritoryOwnedByTenant(slug, stampTerritory);
  }

  let resource: CommunityResource | undefined;
  let experienceId = input.experienceId?.trim() || undefined;
  let displayName: string | undefined;
  let location: string | undefined;
  let areaLabel: string | undefined;
  let imageUrl: string | undefined;
  let inheritedTerritory = stampTerritory;
  let date = input.date?.trim() ?? "";
  let start = input.start?.trim() ?? "";
  let end = input.end?.trim() ?? "";
  let capacity = 1;
  let requiresApproval = false;

  if (context.type === "resource") {
    resource = store.resources.find((item) => item.id === context.id);
    if (!resource || resource.tenantId !== slug) {
      throw new Error("resource_not_found");
    }
    assertSameTerritory(stampTerritory, resource.territoryId);
    if (!resourceIsBookable(resource)) {
      throw new Error("resource_not_bookable");
    }
    inheritedTerritory = resource.territoryId ?? stampTerritory;
    displayName = resource.name;
    location = resource.location;
    areaLabel = resource.areaLabel;
    imageUrl = resource.images?.[0] ?? resource.imageUrl;
    requiresApproval = Boolean(resource.requiresApproval);
    if (!date || !start || !end) {
      throw new Error("invalid_input");
    }
    capacity = slotCapacity(store, resource, date, start, end);
    const used = usedCapacity(store, resource.id, date, start, end);
    const count =
      typeof input.participantCount === "number" && input.participantCount > 0
        ? input.participantCount
        : 1;
    if (used + count > capacity) {
      throw new Error("slot_unavailable");
    }
    if (resource.linkedResourceId) {
      const linked = store.resources.find(
        (item) => item.id === resource!.linkedResourceId,
      );
      if (linked) {
        const linkedCapacity = slotCapacity(
          store,
          linked,
          date,
          start,
          end,
        );
        const linkedUsed = usedCapacity(
          store,
          linked.id,
          date,
          start,
          end,
        );
        if (linkedUsed >= linkedCapacity) {
          throw new Error("slot_unavailable");
        }
      }
    }
  } else if (context.type === "service") {
    resource = store.resources.find((item) => item.id === context.id);
    if (resource && resource.tenantId === slug) {
      assertSameTerritory(stampTerritory, resource.territoryId);
      if (!resourceIsBookable(resource)) {
        throw new Error("resource_not_bookable");
      }
      inheritedTerritory = resource.territoryId ?? stampTerritory;
      displayName = resource.name;
      location = resource.location;
      areaLabel = resource.areaLabel;
      imageUrl = resource.images?.[0] ?? resource.imageUrl;
      requiresApproval = Boolean(resource.requiresApproval);
      if (!date || !start || !end) {
        throw new Error("invalid_input");
      }
      capacity = slotCapacity(store, resource, date, start, end);
      const used = usedCapacity(store, resource.id, date, start, end);
      const count =
        typeof input.participantCount === "number" && input.participantCount > 0
          ? input.participantCount
          : 1;
      if (used + count > capacity) {
        throw new Error("slot_unavailable");
      }
    } else {
      if (!date || !start || !end) {
        throw new Error("invalid_input");
      }
      displayName = "Servicio local";
      inheritedTerritory = stampTerritory;
    }
  } else if (context.type === "experience") {
    const { getExperienceServer } = await import(
      "@/lib/experiences/server-experience-repository"
    );
    const experience = await getExperienceServer(
      slug,
      context.id,
      input.scope,
    );
    if (!experience || experience.tenantId !== slug) {
      throw new Error("context_not_found");
    }
    assertSameTerritory(stampTerritory, experience.territoryId);
    inheritedTerritory = experience.territoryId ?? stampTerritory;
    experienceId = experience.id;
    displayName = experience.title;
    location = experience.location;
    if (!date || !start || !end) {
      const slot = slotFromSchedule(experience.startsAt, experience.endsAt);
      date = slot.date;
      start = slot.start;
      end = slot.end;
    }
    capacity = experience.capacity > 0 ? experience.capacity : 8;
    const used = usedCapacityForContext({
      reservations: store.reservations,
      context,
      date,
      start,
      end,
    });
    const count =
      typeof input.participantCount === "number" && input.participantCount > 0
        ? input.participantCount
        : 1;
    if (experience.resourceId) {
      resource = store.resources.find((item) => item.id === experience.resourceId);
      if (!resource || resource.tenantId !== slug) {
        throw new Error("resource_not_found");
      }
      assertSameTerritory(experience.territoryId, resource.territoryId);
      if (!resourceIsBookable(resource)) {
        throw new Error("resource_not_bookable");
      }
      const facilityCap = slotCapacity(store, resource, date, start, end);
      const facilityUsed = usedCapacity(
        store,
        resource.id,
        date,
        start,
        end,
      );
      if (facilityUsed + count > facilityCap || used + count > capacity) {
        throw new Error("slot_unavailable");
      }
    } else if (used + count > capacity) {
      throw new Error("slot_unavailable");
    }
  } else {
    const { listCommunityEvents } = await import(
      "@/lib/community/server-community-repository"
    );
    const events = await listCommunityEvents(slug, input.scope);
    const event = events.find((item) => item.id === context.id);
    if (!event) throw new Error("context_not_found");
    assertSameTerritory(stampTerritory, event.territoryId);
    inheritedTerritory = event.territoryId ?? stampTerritory;
    displayName = event.title;
    location = event.locationLabel;
    if (!date || !start || !end) {
      const slot = slotFromSchedule(event.startsAt, event.endsAt);
      date = slot.date;
      start = slot.start;
      end = slot.end;
    }
    capacity = 1;
    const used = usedCapacityForContext({
      reservations: store.reservations,
      context,
      date,
      start,
      end,
    });
    if (used >= capacity) throw new Error("slot_unavailable");
  }

  if (inheritedTerritory) {
    assertTerritoryOwnedByTenant(slug, inheritedTerritory);
  }

  const count =
    typeof input.participantCount === "number" && input.participantCount > 0
      ? input.participantCount
      : 1;
  const status: ReservationStatus = requiresApproval ? "pending" : "confirmed";
  const reservation = createReservationRecord({
    tenantId: slug,
    resourceId: resource?.id,
    createdBy: input.createdBy,
    date,
    start,
    end,
    status,
    participantCount: count,
    capacity,
    experienceId,
    contextType: context.type,
    contextId: context.id,
    resourceName: displayName,
    resourceImageUrl: imageUrl,
    location,
    areaLabel,
    territoryId: inheritedTerritory,
  });
  const participant = createReservationParticipantRecord({
    tenantId: slug,
    reservationId: reservation.id,
    personId: input.createdBy,
    createdBy: input.createdBy,
    role: "creator",
  });
  store.reservations = [reservation, ...store.reservations];
  store.participants = [participant, ...store.participants];
  await persistStore(slug, store, input.scope);
  if (status === "confirmed") {
    await notifyReservationConfirmed({
      tenantId: slug,
      personId: input.createdBy,
      reservation,
      scope: input.scope,
    });
  }
  return reservation;
}

export async function updateReservationServer(input: {
  tenantId: string;
  reservationId: string;
  status?: ReservationStatus;
  date?: string;
  start?: string;
  end?: string;
  createdByFromClient?: string | null;
  scope?: ReservationsWriteScope;
}): Promise<Reservation | null> {
  if (input.createdByFromClient) {
    throw new Error("owner_immutable");
  }
  const slug = resolveTenantPublicId(input.tenantId);
  const store = await loadStore(slug, input.scope);
  const index = store.reservations.findIndex((item) => item.id === input.reservationId);
  if (index < 0) return null;
  const current = store.reservations[index]!;
  if (input.status && !isReservationStatus(input.status)) {
    throw new Error("invalid_status");
  }
  const nextDate = input.date ?? current.date;
  const nextStart = input.start ?? current.start;
  const nextEnd = input.end ?? current.end;
  if (input.date || input.start || input.end) {
    const others: ReservationsStore = {
      ...store,
      reservations: store.reservations.filter((item) => item.id !== current.id),
    };
    if (current.resourceId) {
      const resource = store.resources.find((item) => item.id === current.resourceId);
      if (!resource) throw new Error("resource_not_found");
      const capacity = slotCapacity(others, resource, nextDate, nextStart, nextEnd);
      const used = usedCapacity(others, resource.id, nextDate, nextStart, nextEnd);
      if (used + (current.participantCount ?? 1) > capacity) {
        throw new Error("slot_unavailable");
      }
    } else {
      const context = reservationContextOf(current);
      const capacity = current.capacity && current.capacity > 0 ? current.capacity : 1;
      const used = usedCapacityForContext({
        reservations: others.reservations,
        context,
        date: nextDate,
        start: nextStart,
        end: nextEnd,
      });
      if (used + (current.participantCount ?? 1) > capacity) {
        throw new Error("slot_unavailable");
      }
    }
  }
  const next: Reservation = {
    ...current,
    date: nextDate,
    start: nextStart,
    end: nextEnd,
    startTime: `${nextDate}T${nextStart}:00.000Z`,
    endTime: `${nextDate}T${nextEnd}:00.000Z`,
    status: input.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };
  store.reservations[index] = next;
  await persistStore(slug, store, input.scope);
  return withReservationLifecycle(next);
}
