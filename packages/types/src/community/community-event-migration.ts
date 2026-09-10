/**
 * CommunityEvent → Experience(kind=event) migration mapping (ADR-027).
 * Idempotent identity: metadata.legacyCommunityEventId + stable id ex-ce-{uuid}.
 * Does not invent a parallel Event entity.
 */

import type { CommunityEvent, CommunityEventParticipantRole } from "../domain/community-core";
import type {
  ExperienceKind,
  ExperienceLifecycleStatus,
  ExperienceParticipantRole,
} from "../domain/experience";

export const COMMUNITY_EVENT_MIGRATED_FROM = "community_event" as const;

export const LEGACY_COMMUNITY_EVENT_ID_META = "legacyCommunityEventId" as const;

/** Stable Experience id derived from a legacy CommunityEvent uuid. */
export function experienceIdForLegacyCommunityEvent(
  communityEventId: string,
): string {
  const id = communityEventId.trim();
  if (!id) throw new Error("missing_legacy_community_event_id");
  if (id.startsWith("ex-ce-")) return id;
  return `ex-ce-${id}`;
}

export function legacyCommunityEventIdFromExperienceId(
  experienceId: string,
): string | null {
  const id = experienceId.trim();
  if (!id.startsWith("ex-ce-")) return null;
  const legacy = id.slice("ex-ce-".length).trim();
  return legacy || null;
}

export function readLegacyCommunityEventId(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const raw = metadata?.[LEGACY_COMMUNITY_EVENT_ID_META];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function isMigratedFromCommunityEvent(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return (
    metadata?.migratedFrom === COMMUNITY_EVENT_MIGRATED_FROM ||
    Boolean(readLegacyCommunityEventId(metadata))
  );
}

export function mapCommunityEventStatusToExperience(
  status: string,
): ExperienceLifecycleStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "cancelled":
      return "cancelled";
    case "archived":
      return "archived";
    case "published":
    default:
      return "published";
  }
}

export function mapCommunityEventParticipantRole(
  role: CommunityEventParticipantRole | string,
): ExperienceParticipantRole | null {
  switch (role) {
    case "organizer":
      return "creator";
    case "participant":
      return "participant";
    case "invited":
      return "invited";
    default:
      return null;
  }
}

export type CommunityEventExperienceMigrationFields = {
  id: string;
  kind: ExperienceKind;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  status: ExperienceLifecycleStatus;
  ownerPersonId: string;
  createdBy: string;
  territoryId?: string;
  category: string;
  capacity: number;
  metadata: Record<string, unknown>;
};

/**
 * Pure field mapping for backfill. Does not invent missing schedule/territory.
 */
export function mapCommunityEventToExperienceFields(
  event: Pick<
    CommunityEvent,
    | "id"
    | "title"
    | "description"
    | "startsAt"
    | "endsAt"
    | "locationLabel"
    | "status"
    | "authorPersonId"
    | "createdBy"
    | "territoryId"
    | "groupId"
    | "authorDisplayName"
    | "createdAt"
    | "updatedAt"
  >,
): CommunityEventExperienceMigrationFields {
  const description =
    event.description?.trim() || event.title.trim() || "Evento";
  return {
    id: experienceIdForLegacyCommunityEvent(event.id),
    kind: "event",
    title: event.title.trim(),
    description,
    startsAt: event.startsAt,
    ...(event.endsAt ? { endsAt: event.endsAt } : {}),
    location: event.locationLabel?.trim() ?? "",
    status: mapCommunityEventStatusToExperience(event.status),
    ownerPersonId: event.authorPersonId,
    createdBy: event.createdBy || event.authorPersonId,
    ...(event.territoryId ? { territoryId: event.territoryId } : {}),
    category: "custom",
    capacity: 8,
    metadata: {
      migratedFrom: COMMUNITY_EVENT_MIGRATED_FROM,
      [LEGACY_COMMUNITY_EVENT_ID_META]: event.id,
      ...(event.groupId ? { legacyGroupId: event.groupId } : {}),
      ...(event.authorDisplayName?.trim()
        ? { legacyAuthorDisplayName: event.authorDisplayName.trim() }
        : {}),
      legacyCreatedAt: event.createdAt,
      legacyUpdatedAt: event.updatedAt,
    },
  };
}
