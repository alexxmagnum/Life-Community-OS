/**
 * Territory experience layer — Active Territory resolution and query scope.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  canSwitchTerritory,
  resolveActiveTerritory,
} from "@life-community-os/types";
import {
  LIFE_PANORAMICA_TERRITORY_UUID,
  LIFE_VALLEY_TERRITORY_UUID,
} from "@/lib/tenant/ids";
import {
  defaultTerritoryIdForIdentity,
  identityTerritoriesForTenant,
} from "@/lib/tenant/territory-catalog";
import { resolveActiveTerritoryContext } from "@/lib/tenant/resolve-territory";
import {
  createExperienceServer,
  listExperiencesServer,
  replaceExperienceStoreForTests,
} from "@/lib/experiences/server-experience-repository";
import {
  createReservationServer,
  createResourceServer,
  listAvailabilityServer,
  listReservationsServer,
  replaceReservationsStoreForTests,
} from "@/lib/reservations/server-reservations-repository";
import { dateOffsetIso } from "@life-community-os/types";
import { bindLifeMapToActiveTerritory } from "@/lib/life-map/digital-twin";
import type { LifeMapTerritory } from "@life-community-os/types";

process.env.LCOS_EXPERIENCE_FIXTURE = "1";
process.env.LCOS_RESERVATIONS_FIXTURE = "1";
process.env.LCOS_COMMUNITY_FIXTURE = "1";

const PANO = "life-panoramica";
const VALLEY = "life-valley";

describe("territory experience isolation", () => {
  beforeEach(async () => {
    await replaceExperienceStoreForTests(PANO);
    await replaceExperienceStoreForTests(VALLEY);
    await replaceReservationsStoreForTests(PANO);
    await replaceReservationsStoreForTests(VALLEY);
  });

  it("TEST 1 — user with one Territory resolves it", () => {
    const territories = identityTerritoriesForTenant(PANO);
    const resolved = resolveActiveTerritory({
      tenantId: PANO,
      membershipTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territories,
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.context.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.equal(resolved.context.territoryName, "Panorámica Golf");
    assert.notEqual(resolved.context.slug, PANO);
  });

  it("TEST 2 — several Territories use the tenant default", () => {
    const territories = [
      ...identityTerritoriesForTenant(PANO),
      ...identityTerritoriesForTenant(VALLEY).map((item) => ({
        ...item,
        tenantId: PANO,
      })),
    ];
    const resolved = resolveActiveTerritory({
      tenantId: PANO,
      defaultTerritoryId: defaultTerritoryIdForIdentity(PANO),
      territories,
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.context.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
  });

  it("TEST 3 — user can switch to an allowed Territory", () => {
    const territories = identityTerritoriesForTenant(PANO);
    assert.equal(
      canSwitchTerritory({
        tenantId: PANO,
        actorTenantId: PANO,
        requestedTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
        territories,
      }),
      true,
    );
  });

  it("TEST 4 — switching to a foreign Territory is denied", () => {
    const territories = [
      ...identityTerritoriesForTenant(PANO),
      ...identityTerritoriesForTenant(VALLEY),
    ];
    assert.equal(
      canSwitchTerritory({
        tenantId: PANO,
        actorTenantId: PANO,
        requestedTerritoryId: LIFE_VALLEY_TERRITORY_UUID,
        territories,
      }),
      false,
    );
    const denied = resolveActiveTerritoryContext({
      tenantId: PANO,
      queryTerritoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal("error" in denied, true);
  });

  it("TEST 5 — tenant pack does not control Territory", () => {
    const territories = identityTerritoriesForTenant(PANO);
    const resolved = resolveActiveTerritory({
      tenantId: PANO,
      membershipTerritoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      territories,
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    assert.equal(resolved.context.territoryName, "Panorámica Golf");
    assert.notEqual(resolved.context.territoryId, "life-panoramica");
  });

  it("TEST 6 — Life Map receives the Active Territory", () => {
    const packFrame: LifeMapTerritory = {
      tenantId: PANO,
      territoryId: "pack-territory-id",
      defaultCamera: { target: { lat: 0, lng: 0 } },
      layers: [],
      moduleEnabled: true,
    };
    const bound = bindLifeMapToActiveTerritory(packFrame, {
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
      bounds: { south: 37.3, west: -4.9, north: 37.5, east: -4.6 },
    });
    assert.equal(bound.territoryId, LIFE_PANORAMICA_TERRITORY_UUID);
    assert.notEqual(bound.territoryId, packFrame.territoryId);
    assert.equal(bound.bounds?.north, 37.5);
  });

  it("TEST 7 — Experience query uses Active Territory", async () => {
    const created = await createExperienceServer({
      tenantId: PANO,
      ownerPersonId: "person-alex",
      title: "Clase Panorámica",
      description: "Solo este territorio.",
      startsAt: "2026-09-06T10:00:00.000Z",
    });
    const scoped = await listExperiencesServer(PANO, undefined, {
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    assert.equal(scoped.some((item) => item.id === created.id), true);
    const hidden = await listExperiencesServer(PANO, undefined, {
      territoryId: LIFE_VALLEY_TERRITORY_UUID,
    });
    assert.equal(hidden.some((item) => item.id === created.id), false);
  });

  it("TEST 8 — Reservation query uses Active Territory", async () => {
    const resource = await createResourceServer({
      tenantId: PANO,
      createdBy: "person-staff",
      name: "Pista 1",
      description: "Pista del territorio.",
      category: "sport",
      location: "Club",
      capacity: 1,
      slotMinutes: 60,
    });
    const date = dateOffsetIso(0);
    const slots = await listAvailabilityServer(PANO, resource.id, date);
    const slot = slots.find((item) => item.status === "available");
    assert.ok(slot);
    const reservation = await createReservationServer({
      tenantId: PANO,
      createdBy: "person-maria",
      resourceId: resource.id,
      date,
      start: slot!.start,
      end: slot!.end,
    });
    const mine = await listReservationsServer(PANO);
    const inTerritory = mine.filter(
      (item) => item.territoryId === LIFE_PANORAMICA_TERRITORY_UUID,
    );
    assert.equal(inTerritory.some((item) => item.id === reservation.id), true);
    const valleyList = await listReservationsServer(VALLEY);
    assert.equal(valleyList.some((item) => item.id === reservation.id), false);
  });
});
