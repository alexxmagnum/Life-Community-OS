import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createExperienceRecord,
  isExperienceLifecycleStatus,
  participationOccupiesSeat,
} from "./experience";
import { experienceBelongsToTerritory } from "./territory-ownership";

const PANO_TERRITORY = "10000000-0000-4000-8000-000000000002";
const VALLEY_TERRITORY = "20000000-0000-4000-8000-000000000002";

describe("Experience domain contract", () => {
  it("creates a Territory-owned Experience from session ownership", () => {
    const record = createExperienceRecord({
      tenantId: "life-panoramica",
      territoryId: PANO_TERRITORY,
      ownerPersonId: "person-alex",
      createdBy: "person-alex",
      title: "Clase de pádel",
      description: "Partido abierto del sábado.",
      category: "sport",
      startsAt: "2026-09-05T09:00:00.000Z",
    });
    assert.equal(record.tenantId, "life-panoramica");
    assert.equal(record.territoryId, PANO_TERRITORY);
    assert.equal(record.ownerPersonId, "person-alex");
    assert.equal(record.createdBy, "person-alex");
    assert.equal(record.status, "published");
    assert.equal(isExperienceLifecycleStatus(record.status), true);
    assert.equal(
      experienceBelongsToTerritory(record, PANO_TERRITORY, "life-panoramica"),
      true,
    );
    assert.equal(experienceBelongsToTerritory(record, VALLEY_TERRITORY), false);
  });

  it("rejects an Experience without Territory", () => {
    assert.throws(
      () =>
        createExperienceRecord({
          tenantId: "life-panoramica",
          territoryId: "   ",
          ownerPersonId: "person-alex",
          createdBy: "person-alex",
          title: "Ruta",
          description: "Salida grupal.",
          startsAt: "2026-09-05T09:00:00.000Z",
        }),
      /missing_territory/,
    );
  });

  it("does not occupy a seat for waitlist or cancelled roles", () => {
    assert.equal(participationOccupiesSeat("creator"), true);
    assert.equal(participationOccupiesSeat("participant"), true);
    assert.equal(participationOccupiesSeat("waitlist"), false);
    assert.equal(participationOccupiesSeat("cancelled"), false);
  });
});
