/**
 * CommunityEvent → Experience(kind=event) backfill.
 * Idempotent. Does not delete CommunityEvent rows (Phase 3 keep table).
 */

import {
  mapCommunityEventParticipantRole,
  mapCommunityEventToExperienceFields,
  readLegacyCommunityEventId,
  experienceIdForLegacyCommunityEvent,
  type ExperienceRecord,
} from "@life-community-os/types";
import {
  createExperienceServer,
  getExperienceServer,
  listExperiencesServer,
} from "@/lib/experiences/server-experience-repository";
import {
  listAllCommunityEventsServer,
  listEventParticipantsServer,
} from "@/lib/community/server-community-repository";
import { defaultTerritoryIdForTenant } from "@/lib/tenant/resolve-territory";
import { resolveTenantPublicId } from "@/lib/tenant/ids";

export type CommunityEventBackfillScope = {
  accessToken?: string | null;
  personId?: string | null;
};

export type CommunityEventBackfillResult = {
  tenantId: string;
  scanned: number;
  created: number;
  skipped: number;
  experienceIdsByLegacyEventId: Record<string, string>;
};

function findExistingMigrated(
  experiences: ExperienceRecord[],
  legacyEventId: string,
): ExperienceRecord | undefined {
  const stableId = experienceIdForLegacyCommunityEvent(legacyEventId);
  return experiences.find(
    (item) =>
      item.id === stableId ||
      readLegacyCommunityEventId(item.metadata) === legacyEventId,
  );
}

export async function resolveExperienceIdForLegacyCommunityEvent(input: {
  tenantId: string;
  communityEventId: string;
  scope?: CommunityEventBackfillScope;
}): Promise<string | null> {
  const slug = resolveTenantPublicId(input.tenantId);
  const stableId = experienceIdForLegacyCommunityEvent(input.communityEventId);
  const byId = await getExperienceServer(slug, stableId, input.scope);
  if (byId) return byId.id;
  const all = await listExperiencesServer(slug, input.scope);
  const hit = all.find(
    (item) =>
      readLegacyCommunityEventId(item.metadata) === input.communityEventId,
  );
  return hit?.id ?? null;
}

/**
 * Backfill one tenant. Safe to run repeatedly.
 * Skips CommunityEvents without a resolvable territory.
 */
export async function backfillCommunityEventsToExperiences(input: {
  tenantId: string;
  scope?: CommunityEventBackfillScope;
}): Promise<CommunityEventBackfillResult> {
  const slug = resolveTenantPublicId(input.tenantId);
  const events = await listAllCommunityEventsServer(slug, input.scope);
  const existing = await listExperiencesServer(slug, input.scope);
  const experienceIdsByLegacyEventId: Record<string, string> = {};
  let created = 0;
  let skipped = 0;
  const defaultTerritory = defaultTerritoryIdForTenant(slug);

  for (const event of events) {
    const already = findExistingMigrated(existing, event.id);
    if (already) {
      skipped += 1;
      experienceIdsByLegacyEventId[event.id] = already.id;
      continue;
    }
    const territoryId = event.territoryId?.trim() || defaultTerritory;
    if (!territoryId) {
      skipped += 1;
      continue;
    }
    const fields = mapCommunityEventToExperienceFields(event);
    const experience = await createExperienceServer({
      tenantId: slug,
      ownerPersonId: fields.ownerPersonId,
      title: fields.title,
      description: fields.description,
      kind: "event",
      category: fields.category,
      status: fields.status,
      startsAt: fields.startsAt,
      endsAt: fields.endsAt,
      location: fields.location,
      capacity: fields.capacity,
      territoryId,
      metadata: fields.metadata,
      publishToCommunity: false,
      scope: input.scope,
      experienceId: fields.id,
      createdByOverride: fields.createdBy,
    });
    created += 1;
    experienceIdsByLegacyEventId[event.id] = experience.id;
    existing.push(experience);

    const participants = await listEventParticipantsServer(
      slug,
      event.id,
      input.scope,
    );
    for (const row of participants) {
      const role = mapCommunityEventParticipantRole(row.role);
      if (!role || role === "creator") continue;
      try {
        const { joinExperienceServer, inviteExperienceParticipantServer } =
          await import("@/lib/experiences/server-experience-repository");
        if (role === "invited") {
          await inviteExperienceParticipantServer({
            tenantId: slug,
            experienceId: experience.id,
            inviteePersonId: row.personId,
            createdBy: row.createdBy || fields.ownerPersonId,
            scope: input.scope,
          });
        } else if (experience.status === "published") {
          await joinExperienceServer({
            tenantId: slug,
            experienceId: experience.id,
            personId: row.personId,
            scope: input.scope,
          });
        }
      } catch {
        /* Skip participants that cannot map cleanly (already joined, etc.). */
      }
    }
  }

  return {
    tenantId: slug,
    scanned: events.length,
    created,
    skipped,
    experienceIdsByLegacyEventId,
  };
}
