/**
 * Phase 18P-FIX-A — Tenant ≠ Territory ≠ Location isolation.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  createLocation,
  createTerritory,
  emptyTenantFactorySnapshot,
  filterTerritoriesForTenant,
  locationBelongsToTerritory,
  projectLocationToLifeMapView,
  recordMatchesTerritoryScope,
  TenantFactoryService,
  validateLocation,
} from "@life-community-os/types";
import {
  LIFE_PANORAMICA_TENANT_UUID,
  LIFE_PANORAMICA_TERRITORY_UUID,
  tenantSlugToTerritoryUuid,
  tenantSlugToUuid,
} from "@/lib/tenant/ids";
import {
  resolveOptionalTerritoryId,
  resolveStampTerritoryId,
} from "@/lib/tenant/resolve-territory";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");
const REPO_ROOT = path.join(WEB_ROOT, "..", "..", "..");

function readRepo(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

describe("territory model isolation", () => {
  it("TEST 1 — Tenant puede existir sin Territory", () => {
    const tenantSrc = readRepo("packages/types/src/domain/tenant.ts");
    assert.doesNotMatch(tenantSrc, /territoryId/);
    const { snapshot, result } = TenantFactoryService.provision(
      emptyTenantFactorySnapshot(),
      {
        name: "Pueblo Sin Zonas",
        slug: "pueblo-sin-zonas",
        locale: "es",
        timezone: "Europe/Madrid",
        territories: [],
      },
    );
    assert.ok(result.tenantId);
    assert.equal(
      filterTerritoriesForTenant(snapshot.territories, result.tenantId).length,
      0,
    );
  });

  it("TEST 2 — Territory pertenece a Tenant", () => {
    const zone = createTerritory({
      tenantId: "tenant-panoramica",
      name: "Aldea Golf",
    });
    assert.equal(zone.tenantId, "tenant-panoramica");
    assert.notEqual(zone.id, zone.tenantId);
    const terrSrc = readRepo("packages/types/src/domain/territory.ts");
    assert.match(terrSrc, /tenantId: DomainId/);
  });

  it("TEST 3 — Location puede existir sin Territory", () => {
    const loc = createLocation({
      tenantId: "tenant-panoramica",
      type: "facility",
      name: "Calle independiente",
      address: "Calle Real 1",
      latitude: 40.5,
      longitude: 0.3,
      category: "street",
    });
    assert.equal(loc.territoryId, undefined);
    assert.equal(validateLocation(loc).length, 0);
    assert.equal(
      resolveOptionalTerritoryId({ explicit: null, inherited: null }),
      undefined,
    );
    const view = projectLocationToLifeMapView(loc);
    assert.ok(view);
    assert.equal(view!.tenantId, "tenant-panoramica");
    assert.equal(view!.territoryId, undefined);
    const locSrc = readRepo("packages/types/src/domain/location.ts");
    assert.match(locSrc, /territoryId\?: DomainId/);
    const saveSrc = readWeb("lib/location/server-location-repository.ts");
    assert.match(saveSrc, /resolveOptionalTerritoryId/);
    assert.doesNotMatch(saveSrc, /resolveStampTerritoryId/);
  });

  it("TEST 4 — Tenant isolation", () => {
    assert.notEqual(
      LIFE_PANORAMICA_TENANT_UUID,
      LIFE_PANORAMICA_TERRITORY_UUID,
    );
    assert.notEqual(
      tenantSlugToUuid("life-panoramica"),
      tenantSlugToTerritoryUuid("life-panoramica"),
    );
    const a = createLocation({
      tenantId: "life-panoramica",
      type: "facility",
      name: "Pano Place",
      address: "A",
      latitude: 1,
      longitude: 1,
      category: "park",
      territoryId: LIFE_PANORAMICA_TERRITORY_UUID,
    });
    const b = createLocation({
      tenantId: "life-valley",
      type: "facility",
      name: "Valley Place",
      address: "B",
      latitude: 2,
      longitude: 2,
      category: "park",
    });
    assert.notEqual(a.tenantId, b.tenantId);
    assert.equal(
      locationBelongsToTerritory(
        a,
        LIFE_PANORAMICA_TERRITORY_UUID,
        "life-panoramica",
      ),
      true,
    );
    assert.equal(
      locationBelongsToTerritory(
        b,
        LIFE_PANORAMICA_TERRITORY_UUID,
        "life-panoramica",
      ),
      false,
    );
  });

  it("TEST 5 — Territory isolation", () => {
    const terrA = createTerritory({
      id: "terr-a",
      tenantId: "tenant-x",
      name: "Zona A",
    });
    const terrB = createTerritory({
      id: "terr-b",
      tenantId: "tenant-x",
      name: "Zona B",
    });
    const inA = createLocation({
      tenantId: "tenant-x",
      territoryId: terrA.id,
      type: "facility",
      name: "Pool A",
      address: "A",
      latitude: 1,
      longitude: 1,
      category: "pool",
    });
    assert.equal(locationBelongsToTerritory(inA, terrA.id, "tenant-x"), true);
    assert.equal(locationBelongsToTerritory(inA, terrB.id, "tenant-x"), false);
    assert.equal(recordMatchesTerritoryScope(inA.territoryId, terrA.id), true);
    assert.equal(recordMatchesTerritoryScope(inA.territoryId, terrB.id), false);
    assert.equal(recordMatchesTerritoryScope(undefined, terrA.id), true);
  });

  it("TEST 6 — Location permissions / map without forcing Territory", () => {
    const unscoped = createLocation({
      tenantId: "tenant-x",
      type: "community-place",
      name: "Plaza",
      address: "Centro",
      latitude: 40,
      longitude: 0,
      category: "plaza",
      visibility: "public",
    });
    const view = projectLocationToLifeMapView(unscoped);
    assert.ok(view);
    assert.equal(view!.territoryId, undefined);
    const privateLoc = createLocation({
      tenantId: "tenant-x",
      type: "facility",
      name: "Private",
      address: "X",
      latitude: 40,
      longitude: 0,
      category: "home",
      visibility: "private",
    });
    assert.equal(projectLocationToLifeMapView(privateLoc), null);
    const living = readRepo("packages/types/src/platform/life-map-living.ts");
    assert.match(living, /Territory is optional/);
  });

  it("TEST 7 — Membership correcto (Territory-bound hoy; Account ≠ Membership)", () => {
    const mem = readRepo("packages/types/src/domain/membership.ts");
    assert.match(mem, /territoryId: DomainId/);
    assert.match(mem, /tenantId: DomainId/);
    assert.match(mem, /personId: DomainId/);
    const clarity = readWeb("lib/membership/first-user-clarity.ts");
    assert.match(clarity, /JOIN_CODE_LABEL = "Código de acceso"/);
    assert.doesNotMatch(clarity, /Código de comunidad/);
    // Experience domains may still stamp default Territory; Locations must not.
    assert.equal(
      resolveStampTerritoryId({ tenantId: "life-panoramica" }),
      LIFE_PANORAMICA_TERRITORY_UUID,
    );
    assert.equal(
      resolveOptionalTerritoryId({ explicit: null, inherited: null }),
      undefined,
    );
    const model = readRepo("TENANT_TERRITORY_LOCATION_MODEL.md");
    assert.match(model, /Tenant ≠ Territory ≠ Location/);
    assert.match(model, /Location may omit Territory/i);
  });
});
