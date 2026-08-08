import type { DomainId, IsoDateTimeString } from "./ids";
import type { DiffusionPolicy } from "./diffusion";

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
