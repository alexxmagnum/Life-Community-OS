/**
 * Community Experience Feed isolation — projection of existing domains.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import type { ProductCapabilityMap } from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { actorCanReadCommunityExperienceFeed } from "@/lib/community/permissions";
import { CommunityExperienceFeedService } from "@/lib/community/community-experience-feed";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import {
  cancelExperienceServer,
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import {
  createResourceServer,
  replaceReservationsStoreForTests,
} from "@/lib/reservations/server-reservations-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { getTenantPack } from "@/lib/tenant/registry";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";
process.env.LCOS_BUSINESS_FIXTURE = "1";
process.env.LCOS_HELP_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

function memberActor(tenantSlug: string): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId: "person-alex",
    role: "member",
    tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole("member", tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId: "person-alex",
      tenantId: tenantSlug,
      role: "member",
    },
  };
}

function guestActor(tenantSlug: string): RequestActor {
  return {
    ...memberActor(tenantSlug),
    hasMembership: false,
    membershipId: null,
    permissions: [],
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: false,
      personId: "person-guest",
      tenantId: tenantSlug,
      role: "member",
    },
  };
}

async function panoFeed(overrides?: {
  productCapabilities?: ProductCapabilityMap;
}) {
  const pack = getTenantPack(PANO);
  return CommunityExperienceFeedService.list({
    tenantId: PANO,
    territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    productCapabilities: overrides?.productCapabilities ?? pack?.productCapabilities,
    permissions: permissionsForRole("member", PANO),
  });
}

async function valleyFeed() {
  const pack = getTenantPack(VALLEY);
  return CommunityExperienceFeedService.list({
    tenantId: VALLEY,
    territoryId: LIFE_VALLEY_TERRITORY_UUID,
    productCapabilities: pack?.productCapabilities,
    permissions: permissionsForRole("member", VALLEY),
  });
}

describe("community experience feed isolation", () => {
  beforeEach(async () => {
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
    await replaceCommunitySnapshotForTests(PANO);
    await replaceCommunitySnapshotForTests(VALLEY);
    await replaceBusinessStoreForTests(PANO);
    await replaceBusinessStoreForTests(VALLEY);
    await replaceHelpStoreForTests(PANO);
    await replaceHelpStoreForTests(VALLEY);
  });

  it("TEST 1 — a member sees activities of their Territory", async () => {
    assert.equal(actorCanReadCommunityExperienceFeed(memberActor(PANO)), true);
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga en Panorámica",
      description: "Sala Wellness",
      category: "wellness",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    const items = await panoFeed();
    assert.equal(
      items.some((item) => item.experienceId === created.id),
      true,
    );
    assert.equal(
      items.every((item) => item.territoryId === LIFE_PANORAMICA_TERRITORY_UUID),
      true,
    );
  });

  it("TEST 2 — a user does not see another Territory", async () => {
    const guest = guestActor(PANO);
    assert.equal(actorCanReadCommunityExperienceFeed(guest), false);
    const denied = resolveActiveTerritoryContext({
      tenantId: PANO,
      queryTerritoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
    if (!("error" in denied)) return;
    assert.equal(denied.error.status, 403);
    const body = (await denied.error.json()) as { error?: string };
    assert.equal(body.error, "territory_forbidden");
  });

  it("TEST 3 — a published Experience appears", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Clase de yoga",
      description: "Publicada en el territorio.",
      startsAt: "2026-09-06T18:00:00.000Z",
    });
    assert.equal(created.status, "published");
    const items = await panoFeed();
    const match = items.find((item) => item.experienceId === created.id);
    assert.ok(match);
    assert.equal(match.type, "experience");
    assert.equal(match.actions.primary, "join");
  });

  it("TEST 4 — a cancelled Experience disappears", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga cancelado",
      description: "No debe salir en el feed.",
      startsAt: "2026-09-06T18:00:00.000Z",
    });
    await cancelExperienceServer({
      tenantId: PANO,
      experienceId: created.id,
      actorPersonId: "person-alex",
      canManage: false,
    });
    const items = await panoFeed();
    assert.equal(
      items.some((item) => item.experienceId === created.id),
      false,
    );
  });

  it("TEST 5 — available Reservation appears", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Sala Wellness",
      description: "Espacio reservable del club.",
      category: "facility",
      location: "Club",
      locationId: "loc-wellness",
      capacity: 8,
      slotMinutes: 60,
    });
    const items = await panoFeed();
    const match = items.find((item) => item.resourceId === resource.id);
    assert.ok(match);
    assert.equal(match.type, "reservation");
    assert.equal(match.actions.primary, "reserve");
    assert.ok((match.capacity?.available ?? 0) > 0);
  });

  it("TEST 6 — an active Resource appears", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Aquagym",
      description: "Actividad en la piscina.",
      category: "activity",
      location: "Piscina",
      locationId: "loc-pool",
      capacity: 12,
      scheduleStartsAt: "2026-09-06T16:00:00.000Z",
    });
    const items = await panoFeed();
    const match = items.find((item) => item.resourceId === resource.id);
    assert.ok(match);
    assert.equal(match.type, "resource_activity");
    assert.equal(match.actions.primary, "reserve");
    assert.equal(match.locationId, "loc-pool");
  });

  it("TEST 7 — Valley does not see Panorámica", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Solo Panorámica",
      description: "Valley no debe ver esto.",
      startsAt: "2026-09-06T18:00:00.000Z",
    });
    const valleyItems = await valleyFeed();
    assert.equal(
      valleyItems.some((item) => item.experienceId === created.id),
      false,
    );
    assert.equal(
      valleyItems.every(
        (item) => item.territoryId === LIFE_VALLEY_TERRITORY_UUID,
      ),
      true,
    );
  });

  it("TEST 8 — a disabled capability hides the module", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga oculto",
      description: "Experiencias apagadas.",
      startsAt: "2026-09-06T18:00:00.000Z",
    });
    const pack = getTenantPack(PANO);
    assert.ok(pack);
    const items = await panoFeed({
      productCapabilities: {
        ...pack.productCapabilities,
        experiences: false,
      },
    });
    assert.equal(
      items.some((item) => item.experienceId === created.id),
      false,
    );
    assert.equal(
      items.some((item) => item.type === "experience"),
      false,
    );
  });
});
