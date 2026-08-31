/**
 * Community Social Loop isolation — participation around real life, not a social network.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  FORBIDDEN_SOCIAL_NETWORK_TYPES,
  occupyingParticipationCount,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  CommunityParticipationService,
  ParticipationDeniedError,
} from "@/lib/community/community-participation-service";
import {
  createCommunityEvent,
  listCommunityNotifications,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import {
  createHelpRequestServer,
  replaceHelpStoreForTests,
} from "@/lib/help/server-help-repository";
import {
  findConversationByContextServer,
  replaceCommunicationStoreForTests,
} from "@/lib/communication/server-communication-repository";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceReservationsStoreForTests } from "@/lib/reservations/server-reservations-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";

process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";
process.env.LCOS_COMMUNICATION_FIXTURE = "1";
process.env.LCOS_HELP_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function actor(input: {
  tenantSlug: string;
  personId: string;
  territoryId: string;
  hasMembership?: boolean;
}): RequestActor {
  const hasMembership = input.hasMembership ?? true;
  return {
    authenticated: true,
    hasMembership,
    providerReference: "auth-user",
    personId: input.personId,
    role: "member",
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : null,
    permissions: hasMembership ? permissionsForRole("member", input.tenantSlug) : [],
    tenantDenied: false,
    territoryId: input.territoryId,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      personId: input.personId,
      tenantId: input.tenantSlug,
      role: "member",
    },
  };
}

describe("Community Social Loop isolation", () => {
  beforeEach(async () => {
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
    await replaceCommunicationStoreForTests(PANO);
    await replaceCommunicationStoreForTests(VALLEY);
    await replaceHelpStoreForTests(PANO);
    await replaceHelpStoreForTests(VALLEY);
  });

  it("TEST 1 — a member creates an experience", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    assert.equal(created.ownerPersonId, "person-alex");
    const loop = await CommunityParticipationService.resolve({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: owner,
    });
    assert.equal(loop.context.viewerParticipation.status, "joined");
    assert.equal(loop.context.entityType, "experience");
  });

  it("TEST 2 — another member joins", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
      capacity: 12,
    });
    const joined = await CommunityParticipationService.join({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: neighbor,
    });
    assert.equal(joined.context.viewerParticipation.status, "joined");
  });

  it("TEST 3 — participant appears as an aggregate count", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
      capacity: 12,
    });
    await CommunityParticipationService.join({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: neighbor,
    });
    const loop = await CommunityParticipationService.resolve({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: owner,
    });
    assert.ok(occupyingParticipationCount(loop.context.participants) >= 2);
    assert.equal(
      JSON.stringify(loop.context).includes("email"),
      false,
    );
  });

  it("TEST 4 — invitee receives an invitation", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    await CommunityParticipationService.invite({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      inviteePersonId: neighbor.personId!,
      actor: owner,
    });
    const loop = await CommunityParticipationService.resolve({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: neighbor,
    });
    assert.equal(loop.context.viewerParticipation.status, "invited");
    const notes = await listCommunityNotifications(PANO, "person-maria");
    assert.equal(
      notes.some((item) => item.kind === "experience_invited"),
      true,
    );
  });

  it("TEST 5 — another Territory cannot participate", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const outsider = actor({
      tenantSlug: PANO,
      personId: "person-valley",
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    await assert.rejects(
      () =>
        CommunityParticipationService.join({
          tenantId: PANO,
          entityType: "experience",
          entityId: created.id,
          actor: outsider,
        }),
      (error: unknown) => {
        assert.ok(error instanceof ParticipationDeniedError);
        assert.equal(error.message, "cross_territory_forbidden");
        return true;
      },
    );
  });

  it("TEST 6 — a contextual conversation is created", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
      capacity: 12,
    });
    await CommunityParticipationService.join({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: neighbor,
    });
    const thread = await findConversationByContextServer(
      PANO,
      "experience",
      created.id,
      neighbor,
    );
    assert.ok(thread);
    assert.equal(thread.conversation.contextType, "experience");
    assert.equal(thread.conversation.contextId, created.id);
  });

  it("TEST 7 — a notification is sent on join", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
      capacity: 12,
    });
    await CommunityParticipationService.join({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: neighbor,
    });
    const notes = await listCommunityNotifications(PANO, "person-alex");
    assert.equal(
      notes.some((item) => item.kind === "experience_joined"),
      true,
    );
  });

  it("TEST 8 — privacy hides participant identities", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga 18:00",
      description: "Sesión en el clubhouse.",
      startsAt: "2026-09-06T16:00:00.000Z",
      capacity: 12,
    });
    await CommunityParticipationService.join({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: neighbor,
    });
    await CommunityParticipationService.privacy({
      tenantId: PANO,
      actor: neighbor,
      privacy: {
        appearInParticipants: false,
        receiveInvitations: true,
        showActivity: true,
      },
    });
    const loop = await CommunityParticipationService.resolve({
      tenantId: PANO,
      entityType: "experience",
      entityId: created.id,
      actor: owner,
    });
    assert.ok(occupyingParticipationCount(loop.context.participants) >= 2);
    assert.equal(loop.visiblePersonIds.includes("person-maria"), false);
  });

  it("TEST 9 — Valley cannot see Panoramica", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const valley = actor({
      tenantSlug: VALLEY,
      personId: "person-valley",
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: owner.personId!,
      title: "Yoga Panoramica",
      description: "No pertenece a Valley.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    await assert.rejects(
      () =>
        CommunityParticipationService.resolve({
          tenantId: PANO,
          entityType: "experience",
          entityId: created.id,
          actor: valley,
        }),
      (error: unknown) => {
        assert.ok(error instanceof ParticipationDeniedError);
        assert.equal(error.message, "cross_territory_forbidden");
        return true;
      },
    );
  });

  it("TEST 10 — SocialPostEntity does not exist", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(
      path.join(here, "community-participation-service.ts"),
      "utf8",
    );
    const contract = readFileSync(
      path.join(
        here,
        "../../../../../packages/types/src/community/participation.ts",
      ),
      "utf8",
    );
    for (const name of FORBIDDEN_SOCIAL_NETWORK_TYPES) {
      assert.equal(source.includes(`type ${name}`), false);
      assert.equal(contract.includes(`export type ${name}`), false);
    }
  });

  it("help response uses Communication Core", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const help = await createHelpRequestServer({
      tenantId: PANO,
      createdBy: owner.personId!,
      type: "need_help",
      category: "other",
      title: "Necesito una escalera",
      description: "Para un estante en casa.",
    });
    await CommunityParticipationService.respond({
      tenantId: PANO,
      helpId: help.id,
      actor: neighbor,
    });
    const thread = await findConversationByContextServer(
      PANO,
      "help",
      help.id,
      neighbor,
    );
    assert.ok(thread);
    const notes = await listCommunityNotifications(PANO, "person-alex");
    assert.equal(
      notes.some((item) => item.kind === "help_response"),
      true,
    );
  });

  it("events can grow with join", async () => {
    const owner = actor({
      tenantSlug: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const neighbor = actor({
      tenantSlug: PANO,
      personId: "person-maria",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const event = await createCommunityEvent({
      tenantId: PANO,
      authorPersonId: owner.personId!,
      authorDisplayName: "Alex",
      title: "Cena de vecinos",
      startsAt: "2026-09-10T19:00:00.000Z",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    await CommunityParticipationService.join({
      tenantId: PANO,
      entityType: "event",
      entityId: event.id,
      actor: neighbor,
    });
    const loop = await CommunityParticipationService.resolve({
      tenantId: PANO,
      entityType: "event",
      entityId: event.id,
      actor: neighbor,
    });
    assert.equal(loop.context.viewerParticipation.status, "joined");
  });
});
