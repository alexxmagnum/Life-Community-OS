import type { DomainId, IsoDateTimeString } from "./ids";
import type { DiffusionPolicy } from "./diffusion";
import type { CommunityResource } from "./resource";

/**
 * Community Experience — participatory activity / event / meeting (ADR-027).
 * Product UI may label this an “Activity” via i18n. Do not create a parallel Activity type.
 *
 * Phase 17D: Experience is a Territory-owned domain entity (not a catalog, card, or pack seed).
 * Stored lifecycle status is draft | published | cancelled | completed | archived.
 * Viewer statuses (registration_open, full, expired) remain derived, not persisted.
 */

export type ExperienceType = "experience" | "event" | "meeting";

export type ExperienceStatus =
  | "draft"
  | "published"
  | "registration_open"
  | "full"
  | "cancelled"
  | "expired"
  | "completed"
  | "archived";

export const EXPERIENCE_LIFECYCLE_STATUSES = [
  "draft",
  "published",
  "cancelled",
  "completed",
  "archived",
] as const;

export type ExperienceLifecycleStatus =
  (typeof EXPERIENCE_LIFECYCLE_STATUSES)[number];

export const EXPERIENCE_CATEGORIES = [
  "sport",
  "social",
  "food",
  "outdoor",
  "wellness",
  "custom",
] as const;

export type ExperienceCategory = (typeof EXPERIENCE_CATEGORIES)[number];

export type ExperienceOrganizer = {
  id: DomainId;
  name: string;
  avatarUrl?: string;
  roleLabel?: string;
};

/** Display projection for UI cards — not the participation SoT. */
export type ExperienceParticipant = {
  id: DomainId;
  name: string;
  avatarUrl?: string;
};

export const EXPERIENCE_PARTICIPANT_ROLES = [
  "creator",
  "participant",
  "waitlist",
  "cancelled",
] as const;

export type ExperienceParticipantRole =
  (typeof EXPERIENCE_PARTICIPANT_ROLES)[number];

/**
 * Participation SoT. Person is never duplicated — personId references Identity.
 * Optional reservationId links to the existing Reservation domain (no ExperienceReservation).
 */
export type ExperienceParticipation = {
  id: DomainId;
  tenantId: DomainId;
  experienceId: DomainId;
  personId: DomainId;
  createdBy: DomainId;
  role: ExperienceParticipantRole;
  reservationId?: DomainId;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

/**
 * Canonical Experience aggregate for Community Communication Foundation.
 * Links to Channel / Group / Area / Resource are optional organization — not new roots.
 */
export type Experience = {
  id: DomainId;
  tenantId?: DomainId;
  territoryId?: DomainId;
  title: string;
  description: string;
  imageUrl?: string;
  /** ISO 8601 start */
  startsAt: IsoDateTimeString;
  endsAt?: IsoDateTimeString;
  location: string;
  /** Display facet; prefer communityAreaId for structured scope. */
  areaLabel?: string;
  communityAreaId?: DomainId;
  /** Organization layer (ADR-035). */
  channelId?: DomainId;
  /** Creating / hosting group (ADR-029). */
  groupId?: DomainId;
  /** Optional territorial resource used by this experience (ADR-031). */
  resourceId?: DomainId;
  createdByPersonId?: DomainId;
  ownerPersonId?: DomainId;
  createdBy?: DomainId;
  category?: string;
  metadata?: Record<string, unknown>;
  organizer: ExperienceOrganizer;
  capacity: number;
  participantCount: number;
  participants?: ExperienceParticipant[];
  status: ExperienceStatus;
  type: ExperienceType;
  /** Prepared diffusion policy — engine not required in Phase 1a/1b. */
  diffusion?: DiffusionPolicy;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
};

/**
 * Persisted Experience domain record. Territory is required.
 * Cover / gallery live on MediaReference (entityType experience) — not imageUrl.
 */
export type ExperienceRecord = {
  id: DomainId;
  tenantId: DomainId;
  territoryId: DomainId;
  title: string;
  description: string;
  category: string;
  status: ExperienceLifecycleStatus;
  ownerPersonId: DomainId;
  createdBy: DomainId;
  resourceId?: DomainId;
  startsAt: IsoDateTimeString;
  endsAt?: IsoDateTimeString;
  location: string;
  capacity: number;
  metadata: Record<string, unknown>;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

export type CreateExperienceRecordInput = {
  tenantId: DomainId;
  territoryId: DomainId;
  ownerPersonId: DomainId;
  createdBy: DomainId;
  title: string;
  description: string;
  category?: string;
  status?: ExperienceLifecycleStatus;
  resourceId?: DomainId;
  startsAt: IsoDateTimeString;
  endsAt?: IsoDateTimeString;
  location?: string;
  capacity?: number;
  metadata?: Record<string, unknown>;
  id?: DomainId;
};

/** Derived viewer state — not stored on Experience. */
export type ExperienceViewerState =
  | "available"
  | "joined"
  | "waitlisted"
  | "full"
  | "cancelled"
  | "expired";

const LIFECYCLE_SET: ReadonlySet<string> = new Set(EXPERIENCE_LIFECYCLE_STATUSES);
const ROLE_SET: ReadonlySet<string> = new Set(EXPERIENCE_PARTICIPANT_ROLES);
const CATEGORY_SET: ReadonlySet<string> = new Set(EXPERIENCE_CATEGORIES);

export function isExperienceLifecycleStatus(
  value: string,
): value is ExperienceLifecycleStatus {
  return LIFECYCLE_SET.has(value);
}

export function isExperienceParticipantRole(
  value: string,
): value is ExperienceParticipantRole {
  return ROLE_SET.has(value);
}

export function isExperienceCategory(value: string): value is ExperienceCategory {
  return CATEGORY_SET.has(value);
}

export function spotsLeft(experience: Pick<Experience, "capacity" | "participantCount">): number {
  return Math.max(0, experience.capacity - experience.participantCount);
}

export function deriveExperienceViewerState(
  experience: Pick<Experience, "status" | "capacity" | "participantCount">,
  participation: "none" | "registered" | "waitlisted",
): ExperienceViewerState {
  if (participation === "registered") return "joined";
  if (participation === "waitlisted") return "waitlisted";
  if (experience.status === "cancelled") return "cancelled";
  if (experience.status === "expired" || experience.status === "completed") {
    return "expired";
  }
  if (experience.status === "full" || spotsLeft(experience) <= 0) return "full";
  return "available";
}

export function occupyingParticipantRoles(): readonly ExperienceParticipantRole[] {
  return ["creator", "participant"];
}

export function participationOccupiesSeat(
  role: ExperienceParticipantRole,
): boolean {
  return role === "creator" || role === "participant";
}

/**
 * Activity Resource projection — Experience is not a second reservation type.
 * Join creates a Reservation on this Resource (or its linked facility).
 */
export function experienceFromResource(
  resource: CommunityResource,
  participantCount = 0,
): Experience {
  const startsAt =
    resource.scheduleStartsAt ?? resource.createdAt ?? new Date().toISOString();
  const images = resource.images?.filter(Boolean) ?? [];
  const imageUrl = images[0] ?? resource.imageUrl;
  const capacity = resource.capacity && resource.capacity > 0 ? resource.capacity : 8;
  const status: ExperienceStatus =
    resource.status === "archived" || resource.status === "retired"
      ? "archived"
      : resource.status === "inactive" || resource.status === "maintenance"
        ? "cancelled"
        : resource.status === "draft"
          ? "draft"
          : participantCount >= capacity
            ? "full"
            : "registration_open";
  return {
    id: resource.id,
    tenantId: resource.tenantId,
    ...(resource.territoryId ? { territoryId: resource.territoryId } : {}),
    title: resource.name,
    description: resource.description,
    imageUrl,
    startsAt,
    endsAt: resource.scheduleEndsAt,
    location: resource.location,
    areaLabel: resource.areaLabel,
    resourceId: resource.linkedResourceId ?? resource.id,
    createdByPersonId: resource.createdBy,
    createdBy: resource.createdBy,
    ownerPersonId: resource.createdBy,
    organizer: {
      id: resource.createdBy ?? resource.ownerId,
      name: resource.organizerName?.trim() || "Comunidad",
      roleLabel: "Organizador",
    },
    capacity,
    participantCount,
    status,
    type: "experience",
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
}

export function isActivityResource(
  resource: Pick<CommunityResource, "category">,
): boolean {
  return resource.category === "activity";
}

function cryptoRandomId(): string {
  const c =
    typeof globalThis !== "undefined"
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Platform Experience factory. Owner is the session person — never body.ownerId.
 */
export function createExperienceRecord(
  input: CreateExperienceRecordInput,
): ExperienceRecord {
  const tenantId = input.tenantId.trim();
  const territoryId = input.territoryId.trim();
  const ownerPersonId = input.ownerPersonId.trim();
  const createdBy = input.createdBy.trim() || ownerPersonId;
  const title = input.title.trim();
  const description = input.description.trim();
  if (!tenantId) throw new Error("Invalid Experience: missing_tenant");
  if (!territoryId) throw new Error("Invalid Experience: missing_territory");
  if (!ownerPersonId) throw new Error("Invalid Experience: missing_owner");
  if (!title || !description) {
    throw new Error("Invalid Experience: missing_fields");
  }
  const status = input.status ?? "published";
  if (!isExperienceLifecycleStatus(status)) {
    throw new Error("Invalid Experience: invalid_status");
  }
  const categoryRaw = (input.category ?? "custom").trim() || "custom";
  const capacity =
    typeof input.capacity === "number" && input.capacity > 0
      ? Math.floor(input.capacity)
      : 8;
  const startsAt = input.startsAt.trim();
  if (!startsAt) throw new Error("Invalid Experience: missing_schedule");
  return {
    id: input.id?.trim() || `ex-${cryptoRandomId()}`,
    tenantId,
    territoryId,
    title,
    description,
    category: categoryRaw,
    status,
    ownerPersonId,
    createdBy,
    ...(input.resourceId?.trim() ? { resourceId: input.resourceId.trim() } : {}),
    startsAt,
    ...(input.endsAt?.trim() ? { endsAt: input.endsAt.trim() } : {}),
    location: input.location?.trim() ?? "",
    capacity,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createExperienceParticipationRecord(input: {
  tenantId: DomainId;
  experienceId: DomainId;
  personId: DomainId;
  createdBy: DomainId;
  role: ExperienceParticipantRole;
  reservationId?: DomainId;
  id?: DomainId;
}): ExperienceParticipation {
  const role = input.role;
  if (!isExperienceParticipantRole(role)) {
    throw new Error("Invalid ExperienceParticipation: invalid_role");
  }
  const now = new Date().toISOString();
  return {
    id: input.id?.trim() || `exp-${cryptoRandomId()}`,
    tenantId: input.tenantId.trim(),
    experienceId: input.experienceId.trim(),
    personId: input.personId.trim(),
    createdBy: input.createdBy.trim(),
    role,
    ...(input.reservationId?.trim()
      ? { reservationId: input.reservationId.trim() }
      : {}),
    createdAt: now,
    updatedAt: now,
  };
}
