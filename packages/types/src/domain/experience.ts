import type { DomainId, IsoDateTimeString } from "./ids";
import type { DiffusionPolicy } from "./diffusion";
import type { CommunityResource } from "./resource";

/**
 * Community Experience — participatory activity / event / meeting (ADR-027).
 * Product UI may label this an “Activity” via i18n. Do not create a parallel Activity type.
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

export type ExperienceOrganizer = {
  id: DomainId;
  name: string;
  avatarUrl?: string;
  roleLabel?: string;
};

export type ExperienceParticipant = {
  id: DomainId;
  name: string;
  avatarUrl?: string;
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

/** Derived viewer state — not stored on Experience. */
export type ExperienceViewerState =
  | "available"
  | "joined"
  | "waitlisted"
  | "full"
  | "cancelled"
  | "expired";

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
