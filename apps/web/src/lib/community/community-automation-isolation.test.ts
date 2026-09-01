/**
 * Community Automation isolation tests.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach } from "node:test";
import { EMPTY_CURRENT_USER } from "@life-community-os/auth";
import {
  automationRequiresConfirmation,
  createAutomationPreview,
  isOpaqueCommunityAutomationEntity,
  automationRespectsTerritory,
  projectLifePlaceExperienceView,
  dateOffsetIso,
  type MembershipRole,
} from "@life-community-os/types";
import { permissionsForRole } from "@/lib/auth/permissions";
import type { RequestActor } from "@/lib/auth/request-actor";
import { CommunityAutomationService } from "@/lib/community/community-automation-service";
import { replaceCommunitySnapshotForTests } from "@/lib/community/server-community-repository";
import {
  createExperienceServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import { replaceHelpStoreForTests } from "@/lib/help/server-help-repository";
import { replaceLocationsForTests } from "@/lib/location/server-location-repository";
import { LifePlaceQueryService } from "@/lib/life-place/life-place-query";
import { replaceMarketplaceStoreForTests } from "@/lib/marketplace/server-marketplace-repository";
import {
  patchPersonalContextServer,
  replacePersonalStoreForTests,
} from "@/lib/personal/server-personal-repository";
import { replaceBusinessStoreForTests } from "@/lib/business/server-business-repository";
import {
  replaceReservationsStoreForTests,
  createReservationServer,
} from "@/lib/reservations/server-reservations-repository";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import { getTenantPack } from "@/lib/tenant/registry";

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

function actor(input: {
  tenantSlug: string;
  role?: MembershipRole;
  personId?: string;
  hasMembership?: boolean;
}): RequestActor {
  const personId = input.personId ?? "person-alex";
  const hasMembership = input.hasMembership ?? true;
  const role = input.role ?? "member";
  return {
    authenticated: true,
    hasMembership,
    providerReference: "auth-user",
    personId,
    role,
    tenantSlug: input.tenantSlug,
    membershipId: hasMembership ? "mem-1" : "",
    permissions: permissionsForRole(role, input.tenantSlug),
    tenantDenied: false,
    currentUser: {
      ...EMPTY_CURRENT_USER,
      authenticated: true,
      hasMembership,
      personId,
      tenantId: input.tenantSlug,
      role,
    },
  };
}

describe("Community Automation isolation", () => {
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
    await replacePersonalStoreForTests(PANO);
    await replacePersonalStoreForTests(VALLEY);
  });

  it("TEST 1 — reserva genera recordatorio correcto", async () => {
    await createReservationServer({
      tenantId: PANO,
      createdBy: "person-alex",
      context: { type: "service", id: "massage-visit" },
      date: dateOffsetIso(1),
      start: "10:00",
      end: "11:00",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      automation.triggers.some((row) => row.kind === "reservation_upcoming"),
      true,
    );
  });

  it("TEST 2 — usuario puede desactivar sugerencias", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      privacy: { receiveRecommendations: false, shareActivity: true },
    });
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(automation.enabled, false);
    assert.equal(automation.suggestions.length, 0);
  });

  it("TEST 3 — no existe AutomationEntity global", () => {
    assert.equal(isOpaqueCommunityAutomationEntity("GlobalAutomationEntity"), true);
    assert.equal(isOpaqueCommunityAutomationEntity("AIActionExecutor"), true);
  });

  it("TEST 4 — no hay acciones automáticas sin confirmación", async () => {
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    for (const preview of automation.suggestions) {
      assert.equal(automationRequiresConfirmation(preview), true);
    }
  });

  it("TEST 5 — Life Place usa datos reales", async () => {
    await replaceLocationsForTests(PANO, [
      {
        id: "loc-pool",
        tenantId: PANO,
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        type: "facility",
        name: "Piscina",
        address: "Club",
        latitude: 37.41,
        longitude: -4.75,
        category: "pool",
        visibility: "public",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const result = await LifePlaceQueryService.get({
      tenantId: PANO,
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      locationId: "loc-pool",
      actor: actor({ tenantSlug: PANO }),
      productCapabilities: getTenantPack(PANO)?.productCapabilities,
      permissions: permissionsForRole("member", PANO),
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      const view = projectLifePlaceExperienceView(result.context);
      const enriched = await CommunityAutomationService.enrichLifePlaceView(view, {
        tenantId: PANO,
        actor: actor({ tenantSlug: PANO }),
        territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        place: result.context,
      });
      assert.equal(enriched.locationId, "loc-pool");
    }
  });

  it("TEST 6 — Experience permanece autoridad", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Aquagym",
      description: "Piscina",
      status: "published",
      startsAt: new Date(Date.now() + 7200_000).toISOString(),
    });
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      automation.triggers.every((row) => !("autoExecute" in row)),
      true,
    );
  });

  it("TEST 7 — privacy respetada", async () => {
    await patchPersonalContextServer({
      tenantId: PANO,
      personId: "person-alex",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      privacy: { receiveRecommendations: false, shareActivity: false },
    });
    const result = await CommunityAutomationService.confirm({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      previewId: "preview:any",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "recommendations_disabled");
  });

  it("TEST 8 — Community Admin limitado", async () => {
    const admin = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, role: "administrator" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const member = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, role: "member" }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(admin.permissions.canViewAdminHints, true);
    assert.equal(member.permissions.canViewAdminHints, false);
  });

  it("TEST 9 — tenant isolation", async () => {
    const pano = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      automationRespectsTerritory(pano, PANO, LIFE_PANORAMICA_TERRITORY_UUID),
      true,
    );
    assert.equal(
      automationRespectsTerritory(pano, VALLEY, LIFE_VALLEY_TERRITORY_UUID),
      false,
    );
  });

  it("TEST 10 — Valley separado de Panorámica", () => {
    assert.notEqual(LIFE_PANORAMICA_TERRITORY_UUID, LIFE_VALLEY_TERRITORY_UUID);
    const source = readFileSync(
      path.join(HERE, "community-automation-service.ts"),
      "utf8",
    );
    assert.equal(/if tenant === panoramica/.test(source), false);
  });

  it("TEST 11 — preview desde trigger", async () => {
    await createReservationServer({
      tenantId: PANO,
      createdBy: "person-alex",
      context: { type: "service", id: "massage-visit" },
      date: dateOffsetIso(1),
      start: "18:00",
      end: "19:00",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const trigger = automation.triggers[0];
    assert.ok(trigger);
    const preview = await CommunityAutomationService.preview({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      triggerId: trigger.id,
    });
    assert.equal(preview?.triggerId, trigger.id);
  });

  it("TEST 12 — confirm requiere membership", async () => {
    const result = await CommunityAutomationService.confirm({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, hasMembership: false }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      previewId: "preview:x",
    });
    assert.equal(result.ok, false);
  });

  it("TEST 13 — createAutomationPreview humano", () => {
    const preview = createAutomationPreview({
      id: "t-1",
      kind: "experience_upcoming",
      sourceType: "experience",
      sourceId: "exp-1",
      title: "Clase mañana",
      body: "Aquagym",
      reason: "Porque hay actividad programada cerca de ti",
    });
    assert.equal(preview.explanation.includes("Porque"), true);
  });

  it("TEST 14 — automation context sin behaviorProfile", async () => {
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal("behaviorProfile" in automation, false);
    assert.equal("habitEngine" in automation, false);
  });

  it("TEST 15 — experience upcoming trigger", async () => {
    await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Yoga matinal",
      description: "Terraza",
      status: "published",
      startsAt: new Date(Date.now() + 36_000_000).toISOString(),
    });
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      automation.triggers.some((row) => row.kind === "experience_upcoming"),
      true,
    );
  });

  it("TEST 16 — no opaque entities in service", () => {
    assert.equal(isOpaqueCommunityAutomationEntity("ResidentHabitEngine"), true);
    assert.equal(isOpaqueCommunityAutomationEntity("EngagementAutomationScore"), true);
  });

  it("TEST 17 — territory scoped reservations", async () => {
    await createReservationServer({
      tenantId: VALLEY,
      createdBy: "person-alex",
      context: { type: "service", id: "valley-service" },
      date: dateOffsetIso(1),
      start: "09:00",
      end: "10:00",
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    const pano = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(
      pano.triggers.every((row) => !row.id.includes("valley-service")),
      true,
    );
  });

  it("TEST 18 — guest no recibe automation personal", async () => {
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO, hasMembership: false }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(automation.permissions.canConfirm, false);
  });

  it("TEST 19 — preview not found", async () => {
    const preview = await CommunityAutomationService.preview({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      triggerId: "missing-trigger",
    });
    assert.equal(preview, null);
  });

  it("TEST 20 — resolveTriggers export", async () => {
    const automation = await CommunityAutomationService.resolve({
      tenantId: PANO,
      actor: actor({ tenantSlug: PANO }),
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(Array.isArray(automation.triggers), true);
    assert.equal(Array.isArray(automation.suggestions), true);
  });
});
