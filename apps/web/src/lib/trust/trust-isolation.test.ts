/**
 * Community Trust isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  businessTrustLabels,
  hasPublicTrustScoring,
  isOpaqueTrustEntity,
  publicPersonTrustLabels,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  createRegisteredBusiness,
  replaceBusinessStoreForTests,
  setBusinessStatus,
} from "@/lib/business/server-business-repository";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import { createHelpRequestServer } from "@/lib/help/server-help-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { replaceMarketplaceStoreForTests } from "@/lib/marketplace/server-marketplace-repository";
import { replaceReservationsStoreForTests } from "@/lib/reservations/server-reservations-repository";
import {
  createExperienceServer,
  getExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import {
  TrustDeniedError,
  TrustSignalService,
} from "@/lib/trust/trust-signal-service";
import { replaceTrustStoreForTests } from "@/lib/trust/server-trust-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

process.env.LCOS_LOCATION_FIXTURE = "1";
process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";
process.env.LCOS_BUSINESS_FIXTURE = "1";
process.env.LCOS_HELP_FIXTURE = "1";
process.env.LCOS_MARKETPLACE_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";
const HERE = path.dirname(fileURLToPath(import.meta.url));

function memberActor(tenantSlug: string, personId = "person-alex"): RequestActor {
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId,
    role: "member",
    tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole("member", tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: tenantSlug,
      role: "member",
    },
  };
}

describe("Community Trust isolation", () => {
  beforeEach(async () => {
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
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
    await replaceMarketplaceStoreForTests(PANO);
    await replaceMarketplaceStoreForTests(VALLEY);
    await replaceTrustStoreForTests(PANO);
    await replaceTrustStoreForTests(VALLEY);
  });

  it("TEST 1 — creating an experience generates a hosted signal", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga vecinal",
      description: "Sala Wellness.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    const context = await TrustSignalService.resolve({
      tenantId: PANO,
      actor: memberActor(PANO),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(context.signals.experienceHosted >= 1);
    assert.equal(hasPublicTrustScoring(JSON.stringify(context)), false);
  });

  it("TEST 2 — offering help generates a help signal", async () => {
    await createHelpRequestServer({
      tenantId: PANO,
      createdBy: "person-alex",
      type: "offer_help",
      title: "Ayudo con la compra",
      description: "Puedo acercarme al súper.",
    });
    const context = await TrustSignalService.resolve({
      tenantId: PANO,
      actor: memberActor(PANO),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(context.signals.helpProvided >= 1);
  });

  it("TEST 3 — another user cannot read private signals", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Golf privado",
      description: "Campo.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    await assert.rejects(
      () =>
        TrustSignalService.resolve({
          tenantId: PANO,
          actor: memberActor(PANO, "person-maria"),
          territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
          personId: "person-alex",
        }),
      TrustDeniedError,
    );
    const labels = await TrustSignalService.publicLabels({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      personId: "person-alex",
    });
    assert.deepEqual(labels, []);
  });

  it("TEST 4 — Territory isolation still applies", async () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 5 — TrustEntity does not exist", () => {
    const source = readFileSync(
      path.join(HERE, "trust-signal-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueTrustEntity("TrustEntity"), true);
    assert.equal(/export type TrustEntity/.test(source), false);
    assert.equal(/export type ReputationEntity/.test(source), false);
    assert.equal(/export type CommunityPointsEntity/.test(source), false);
    assert.equal(/export type UserScoreEntity/.test(source), false);
  });

  it("TEST 6 — no public scoring exists", () => {
    const labels = businessTrustLabels({
      registered: true,
      locationConfirmed: true,
      published: true,
    });
    assert.equal(labels.some((item) => hasPublicTrustScoring(item)), false);
    assert.equal(labels.includes("Negocio registrado"), true);
  });

  it("TEST 7 — experience keeps the correct organizer", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Partida de pádel",
      description: "Pistas.",
      startsAt: "2026-09-06T17:00:00.000Z",
    });
    const loaded = await getExperienceServer(PANO, created.id);
    assert.equal(loaded?.ownerPersonId, "person-alex");
  });

  it("TEST 8 — a verified business shows a signal", async () => {
    const created = await createRegisteredBusiness({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      name: "Taller Alex",
      category: "electrician",
      description: "Servicio local",
      address: "Calle Mayor 1, Castelló, España",
      latitude: 40.508,
      longitude: 0.332,
      type: "service",
    });
    await setBusinessStatus({
      tenantId: PANO,
      businessId: created.business.id,
      status: "published",
    });
    const context = await TrustSignalService.resolve({
      tenantId: PANO,
      actor: memberActor(PANO),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(context.signals.verifiedBusinesses >= 1);
    const labels = businessTrustLabels({
      registered: true,
      locationConfirmed: Boolean(created.business.locationId),
      published: true,
    });
    assert.ok(labels.includes("Ubicación confirmada"));
  });

  it("TEST 9 — Valley does not receive Panorámica", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-trust-pano",
      title: "Solo Panorámica",
      description: "No debe contar en Valley.",
      startsAt: "2026-09-06T10:00:00.000Z",
    });
    const pano = await TrustSignalService.resolve({
      tenantId: PANO,
      actor: memberActor(PANO, "person-trust-pano"),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(pano.signals.experienceHosted >= 1);
    const valley = await TrustSignalService.resolve({
      tenantId: VALLEY,
      actor: memberActor(VALLEY, "person-trust-pano"),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(valley.signals.experienceHosted, 0);
  });

  it("TEST 10 — privacy off hides public signals", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Tres partidas",
      description: "Campo.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    const actor = memberActor(PANO);
    await TrustSignalService.savePrivacy({
      tenantId: PANO,
      actor,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      privacy: { visible: false, showSignals: false },
    });
    const own = await TrustSignalService.resolve({
      tenantId: PANO,
      actor,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.ok(own.signals.experienceHosted >= 1);
    assert.deepEqual(publicPersonTrustLabels(own), []);
    const publicLabels = await TrustSignalService.publicLabels({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      personId: "person-alex",
    });
    assert.deepEqual(publicLabels, []);
  });
});
