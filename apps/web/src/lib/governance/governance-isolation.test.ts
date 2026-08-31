/**
 * Community Governance isolation.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  isOpaqueGovernanceEntity,
  redactReporter,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { replaceReservationsStoreForTests } from "@/lib/reservations/server-reservations-repository";
import {
  CommunityGovernanceService,
  GovernanceDeniedError,
} from "@/lib/governance/community-governance-service";
import { replaceGovernanceStoreForTests } from "@/lib/governance/server-governance-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";

process.env.LCOS_LOCATION_FIXTURE = "1";
process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_ADMIN_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";
const HERE = path.dirname(fileURLToPath(import.meta.url));

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
}): RequestActor {
  const role = input.role ?? "member";
  const personId = input.personId ?? "person-alex";
  return {
    authenticated: true,
    hasMembership: true,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: "mem-1",
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership: true,
      personId,
      tenantId: input.tenantSlug,
      role,
    },
  };
}

describe("Community Governance isolation", () => {
  beforeEach(async () => {
    await replaceLocationsForTests(PANO);
    await replaceLocationsForTests(VALLEY);
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
    await replaceGovernanceStoreForTests(PANO);
    await replaceGovernanceStoreForTests(VALLEY);
  });

  it("TEST 1 — a member can report an Experience", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga vecinal",
      description: "Sala Wellness.",
      startsAt: "2026-09-06T16:00:00.000Z",
    });
    const report = await CommunityGovernanceService.createReport({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      entityType: "experience",
      entityId: created.id,
      reason: "spam",
    });
    assert.equal(report.entityType, "experience");
    assert.equal(report.entityId, created.id);
    assert.equal(report.status, "open");
    const own = await CommunityGovernanceService.listOwnReports({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(own.length, 1);
  });

  it("TEST 2 — territorial moderator sees the report", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Pádel",
      description: "Pistas.",
      startsAt: "2026-09-06T17:00:00.000Z",
    });
    await CommunityGovernanceService.createReport({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      entityType: "experience",
      entityId: created.id,
      reason: "inappropriate",
    });
    const listed = await CommunityGovernanceService.listReports({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "moderator",
        personId: "person-mod",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.entityType, "experience");
  });

  it("TEST 3 — another Territory cannot access the report", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Solo Panorámica",
      description: "Privado.",
      startsAt: "2026-09-06T10:00:00.000Z",
    });
    await CommunityGovernanceService.createReport({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      entityType: "experience",
      entityId: created.id,
      reason: "spam",
    });
    await assert.rejects(
      () =>
        CommunityGovernanceService.listReports({
          tenantId: PANO,
          actor: actor({
            tenantSlug: VALLEY,
            role: "moderator",
            personId: "person-valley-mod",
          }),
          territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        }),
      GovernanceDeniedError,
    );
  });

  it("TEST 4 — reporter stays private", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Cena",
      description: "Club.",
      startsAt: "2026-09-06T20:00:00.000Z",
    });
    const report = await CommunityGovernanceService.createReport({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      entityType: "experience",
      entityId: created.id,
      reason: "other",
    });
    const publicView = redactReporter(report);
    assert.equal(publicView.reporterProtected, true);
    assert.equal("reporterPersonId" in publicView, false);
    const listed = await CommunityGovernanceService.listReports({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "moderator",
        personId: "person-mod",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("reporterPersonId" in listed[0]!, false);
  });

  it("TEST 5 — moderator cannot administer another Territory", async () => {
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
    await assert.rejects(
      () =>
        CommunityGovernanceService.createRule({
          tenantId: PANO,
          actor: actor({
            tenantSlug: VALLEY,
            role: "moderator",
            personId: "person-valley-mod",
          }),
          territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
          title: "Norma ajena",
          description: "No.",
        }),
      GovernanceDeniedError,
    );
  });

  it("TEST 6 — rules belong to the Territory", async () => {
    await CommunityGovernanceService.createRule({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "administrator",
        personId: "person-admin",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      title: "Respeto entre vecinos",
      description: "Convive con cuidado.",
    });
    const pano = await CommunityGovernanceService.resolve({
      tenantId: PANO,
      actor: actor({
        tenantSlug: PANO,
        role: "administrator",
        personId: "person-admin",
      }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(pano.rules.length, 1);
    assert.equal(pano.rules[0]?.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    const valley = await CommunityGovernanceService.resolve({
      tenantId: VALLEY,
      actor: actor({
        tenantSlug: VALLEY,
        role: "administrator",
        personId: "person-valley-admin",
      }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(valley.rules.length, 0);
  });

  it("TEST 7 — ReputationPenalty does not exist", () => {
    const source = readFileSync(
      path.join(HERE, "community-governance-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueGovernanceEntity("ReputationPenalty"), true);
    assert.equal(/export type ReputationPenalty/.test(source), false);
  });

  it("TEST 8 — GlobalBan does not exist", () => {
    const source = readFileSync(
      path.join(HERE, "community-governance-service.ts"),
      "utf8",
    );
    assert.equal(isOpaqueGovernanceEntity("GlobalBan"), true);
    assert.equal(/export type GlobalBan/.test(source), false);
    assert.equal(/export type UniversalContentEntity/.test(source), false);
    assert.equal(/export type GlobalModerator/.test(source), false);
  });

  it("TEST 9 — Valley is separated from Panorámica", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Solo Panorámica",
      description: "No cruza.",
      startsAt: "2026-09-06T10:00:00.000Z",
    });
    await CommunityGovernanceService.createReport({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      entityType: "experience",
      entityId: created.id,
      reason: "safety",
    });
    const valley = await CommunityGovernanceService.listReports({
      tenantId: VALLEY,
      actor: actor({
        tenantSlug: VALLEY,
        role: "moderator",
        personId: "person-valley-mod",
      }),
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(valley.length, 0);
    const denied = resolveActiveTerritoryContext({
      tenantId: VALLEY,
      queryTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 10 — safety action is audited", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aviso",
      description: "Contenido.",
      startsAt: "2026-09-06T12:00:00.000Z",
    });
    const report = await CommunityGovernanceService.createReport({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, personId: "person-maria" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      entityType: "experience",
      entityId: created.id,
      reason: "inappropriate",
    });
    const moderator = actor({
      tenantSlug: PANO,
      role: "moderator",
      personId: "person-mod",
    });
    const action = await CommunityGovernanceService.applySafetyAction({
      tenantId: PANO,
      actor: moderator,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      type: "hide",
      entityType: "experience",
      entityId: created.id,
      reportId: report.id,
      reason: "fuera de normas",
    });
    assert.equal(action.type, "hide");
    assert.equal(action.actorPersonId, "person-mod");
    assert.equal(action.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    const listed = await CommunityGovernanceService.listSafetyActions({
      tenantId: PANO,
      actor: moderator,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.id, action.id);
    assert.equal(listed[0]?.reason, "fuera de normas");
  });
});
