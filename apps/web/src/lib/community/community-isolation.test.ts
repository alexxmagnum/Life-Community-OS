/**
 * Community Core isolation and permission tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import { mutationDenial } from "@/lib/auth/mutation-gate";
import {
  canModerateCommunity,
  actorCanCreatePost,
} from "@/lib/community/permissions";
import {
  createCommunityEvent,
  createCommunityPost,
  listCommunityEvents,
  listPublishedPosts,
  moderateCommunityPost,
  replaceCommunitySnapshotForTests,
} from "@/lib/community/server-community-repository";
import type { RequestActor } from "@/lib/auth/request-actor";
import { permissionsForRole } from "@/lib/auth/permissions";

process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function memberActor(tenantSlug: string, role: RequestActor["role"]): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId: "person-alex",
    role,
    tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(role),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId: "person-alex",
      tenantId: tenantSlug,
      role,
    },
  };
}

describe("community core isolation", () => {
  beforeEach(async () => {
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
  });

  it("TEST 1 — Panoramica member creates a publication", async () => {
    const post = await createCommunityPost({
      tenantId: PANO,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Hola comunidad",
      body: "Publicación real de Panorámica.",
    });
    assert.equal(post.tenantId, PANO);
    assert.equal(post.createdBy, "person-alex");
    const feed = await listPublishedPosts(PANO);
    assert.equal(feed.some((item) => item.id === post.id), true);
  });

  it("TEST 2 — Valley does not see the Panoramica publication", async () => {
    const post = await createCommunityPost({
      tenantId: PANO,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Solo Panorámica",
      body: "No debe salir en Valley.",
    });
    const valleyFeed = await listPublishedPosts(VALLEY);
    assert.equal(
      valleyFeed.some((item) => item.id === post.id),
      false,
    );
    assert.equal(
      valleyFeed.every((item) => item.tenantId === VALLEY),
      true,
    );
  });

  it("TEST 3 — member cannot moderate", () => {
    const actor = memberActor(PANO, "member");
    assert.equal(canModerateCommunity(actor.role), false);
  });

  it("TEST 4 — moderator can moderate", async () => {
    const actor = memberActor(PANO, "moderator");
    assert.equal(canModerateCommunity(actor.role), true);
    const post = await createCommunityPost({
      tenantId: PANO,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "A moderar",
      body: "Contenido a ocultar.",
    });
    const hidden = await moderateCommunityPost({
      tenantId: PANO,
      postId: post.id,
      status: "hidden",
    });
    assert.equal(hidden?.status, "hidden");
    const feed = await listPublishedPosts(PANO);
    assert.equal(feed.some((item) => item.id === post.id), false);
  });

  it("TEST 5 — user without membership cannot publish", () => {
    const denied = mutationDenial({
      authenticated: true,
      hasMembership: false,
      providerReference: "auth-alex",
      personId: null,
      role: null,
      tenantSlug: PANO,
      membershipId: null,
      permissions: [],
      tenantDenied: false,
      currentUser: {
        ...EMPTY_CURRENT_USER,
        authenticated: true,
        hasMembership: false,
      },
    });
    assert.ok(denied);
    assert.equal(denied?.status, 401);
    const guest = {
      ...memberActor(PANO, "member"),
      hasMembership: false,
      personId: null,
      role: null,
      permissions: [],
    };
    assert.equal(actorCanCreatePost(guest), false);
  });

  it("TEST 6 — event belongs to the correct tenant", async () => {
    const event = await createCommunityEvent({
      tenantId: PANO,
      authorPersonId: "person-alex",
      authorDisplayName: "Alex",
      title: "Pádel al atardecer",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      locationLabel: "Pistas",
    });
    assert.equal(event.tenantId, PANO);
    const valleyEvents = await listCommunityEvents(VALLEY);
    assert.equal(
      valleyEvents.some((item) => item.id === event.id),
      false,
    );
    const panoEvents = await listCommunityEvents(PANO);
    assert.equal(panoEvents.some((item) => item.id === event.id), true);
  });
});
