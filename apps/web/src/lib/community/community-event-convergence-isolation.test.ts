/**
 * Phase 3 — CommunityEvent → Experience(kind=event) convergence isolation.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  experienceIdForLegacyCommunityEvent,
  readLegacyCommunityEventId,
} from "@life-community-os/types";
import type { RequestActor } from "@/lib/auth/request-actor";
import { permissionsForRole } from "@/lib/auth/permissions";
import { LIFE_PANORAMICA_TERRITORY_UUID } from "@/lib/tenant/ids";
import { backfillCommunityEventsToExperiences } from "@/lib/community/community-event-backfill";
import {
  createCommunityEvent,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import { listCommunityExperienceFeed } from "@/lib/community/community-experience-feed";
import {
  listExperiencesServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";

process.env.LCOS_COMMUNITY_FIXTURE = "1";
process.env.LCOS_EXPERIENCE_FIXTURE = "1";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(partial: {
  tenantSlug: string;
  role?: RequestActor["role"];
  personId?: string;
}): RequestActor {
  const role = partial.role ?? "member";
  const personId = partial.personId ?? "person-alex";
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: partial.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(role),
    tenantDenied: false,
    territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: partial.tenantSlug,
      role,
      displayName: "Alex",
    },
  };
}

describe("CommunityEvent convergence isolation", () => {
  beforeEach(async () => {
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
  });

  it("backfills CommunityEvent to Experience(kind=event) idempotently", async () => {
    const event = await createCommunityEvent({
      tenantId: PANO,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Fiesta legacy",
      description: "En casa",
      startsAt: "2026-09-20T21:00:00.000Z",
      locationLabel: "Casa",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const first = await backfillCommunityEventsToExperiences({ tenantId: PANO });
    assert.equal(first.created, 1);
    assert.equal(
      first.experienceIdsByLegacyEventId[event.id],
      experienceIdForLegacyCommunityEvent(event.id),
    );
    const second = await backfillCommunityEventsToExperiences({ tenantId: PANO });
    assert.equal(second.created, 0);
    assert.equal(second.skipped, 1);
    const listed = await listExperiencesServer(PANO);
    const migrated = listed.filter((item) => item.kind === "event");
    assert.equal(migrated.length, 1);
    assert.equal(readLegacyCommunityEventId(migrated[0]!.metadata), event.id);
  });

  it("feed does not dual-project migrated CommunityEvent + Experience", async () => {
    const event = await createCommunityEvent({
      tenantId: PANO,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Concierto",
      description: "Música",
      startsAt: "2026-09-21T20:00:00.000Z",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    await backfillCommunityEventsToExperiences({ tenantId: PANO });
    const member = actor({ tenantSlug: PANO });
    const feed = await listCommunityExperienceFeed({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      permissions: member.permissions,
      scope: { personId: member.personId },
    });
    const experienceCards = feed.filter(
      (item) => item.type === "experience" && item.title === "Concierto",
    );
    const legacyCards = feed.filter((item) => item.id === `event:${event.id}`);
    assert.equal(legacyCards.length, 0);
    assert.ok(experienceCards.length >= 1);
  });

  it("API route no longer imports createCommunityEvent for writes", () => {
    const source = readFileSync(
      path.join(root, "src/app/api/community/events/route.ts"),
      "utf8",
    );
    assert.equal(/createCommunityEvent\b/.test(source), false);
    assert.equal(source.includes("createExperienceServer"), true);
    assert.equal(source.includes('kind: "event"'), true);
  });

  it("resource create no longer side-writes CommunityEvent", () => {
    const source = readFileSync(
      path.join(root, "src/lib/reservations/server-reservations-repository.ts"),
      "utf8",
    );
    assert.equal(source.includes("createCommunityEvent({"), false);
  });

  it("composer and create screens do not write CommunityEvent", () => {
    const composer = readFileSync(
      path.join(root, "src/screens/CreateExperienceScreen.tsx"),
      "utf8",
    );
    const legacy = readFileSync(
      path.join(root, "src/screens/CreateCommunityEventScreen.tsx"),
      "utf8",
    );
    assert.equal(composer.includes("createCommunityEvent"), false);
    assert.equal(legacy.includes("createCommunityEventRequest"), false);
  });

  it("keeps Valley isolated from Panorámica backfill", async () => {
    await createCommunityEvent({
      tenantId: PANO,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Solo Pano",
      startsAt: "2026-09-22T18:00:00.000Z",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    await backfillCommunityEventsToExperiences({ tenantId: PANO });
    const valley = await listExperiencesServer(VALLEY);
    assert.equal(
      valley.some((item) => item.title === "Solo Pano"),
      false,
    );
  });
});
