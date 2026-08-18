/**
 * Critical multi-tenant isolation smoke tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lifeValleyExperienceSeedIds } from "@/lib/catalog/bootstrap-catalog";
import { catalogLocationId } from "@/lib/location/location-href";
import {
  LIFE_PANORAMICA_TENANT_SLUG,
  LIFE_PANORAMICA_TENANT_UUID,
  LIFE_VALLEY_TENANT_SLUG,
  LIFE_VALLEY_TENANT_UUID,
  resolveTenantPublicId,
  tenantSlugToTerritoryUuid,
  tenantSlugToUuid,
  tenantUuidToSlug,
} from "./ids";

describe("tenant identity mapping", () => {
  it("maps both product tenants to distinct stable UUIDs", () => {
    assert.equal(
      resolveTenantPublicId(LIFE_PANORAMICA_TENANT_SLUG),
      "life-panoramica",
    );
    assert.equal(resolveTenantPublicId(LIFE_VALLEY_TENANT_SLUG), "life-valley");
    assert.ok(tenantSlugToUuid("life-panoramica"));
    assert.ok(tenantSlugToUuid("life-valley"));
    assert.notEqual(
      tenantSlugToUuid("life-panoramica"),
      tenantSlugToUuid("life-valley"),
    );
    assert.notEqual(
      tenantSlugToTerritoryUuid("life-panoramica"),
      tenantSlugToTerritoryUuid("life-valley"),
    );
  });

  it("round-trips tenant UUIDs through resolveTenantPublicId", () => {
    assert.equal(
      resolveTenantPublicId(LIFE_PANORAMICA_TENANT_UUID),
      "life-panoramica",
    );
    assert.equal(resolveTenantPublicId(LIFE_VALLEY_TENANT_UUID), "life-valley");
    assert.equal(tenantUuidToSlug(LIFE_PANORAMICA_TENANT_UUID), "life-panoramica");
    assert.equal(tenantUuidToSlug(LIFE_VALLEY_TENANT_UUID), "life-valley");
    assert.equal(
      tenantSlugToUuid(resolveTenantPublicId(LIFE_VALLEY_TENANT_UUID)),
      LIFE_VALLEY_TENANT_UUID,
    );
  });
});

describe("life-valley catalog seed isolation", () => {
  it("experience seed ids start with lv-", () => {
    const ids = lifeValleyExperienceSeedIds();
    assert.ok(ids.length > 0);
    for (const id of ids) {
      assert.ok(id.startsWith("lv-"), `expected lv- prefix, got ${id}`);
    }
  });
});

describe("location catalog id isolation", () => {
  it("does not collide catalog Location ids across tenants", () => {
    const entity = "plaza";
    const pano = catalogLocationId(`lp-${entity}`, "life-panoramica");
    const valley = catalogLocationId(`lv-${entity}`, "life-valley");
    assert.notEqual(pano, valley);
    assert.ok(pano.includes("life-panoramica"));
    assert.ok(valley.includes("life-valley"));
  });

  it("preserves already-qualified Location ids", () => {
    const id = "loc-catalog-lv-plaza-life-valley";
    assert.equal(catalogLocationId(id, "life-panoramica"), id);
  });

  it("Valley seeded places stay under life-valley suffix", () => {
    const plaza = catalogLocationId("lv-plaza", "life-valley");
    const cafe = catalogLocationId("lv-cafe", "life-valley");
    assert.equal(plaza, "loc-catalog-lv-plaza-life-valley");
    assert.equal(cafe, "loc-catalog-lv-cafe-life-valley");
    assert.ok(!plaza.includes("life-panoramica"));
    assert.ok(!cafe.includes("life-panoramica"));
  });
});

describe("write tenant binding", () => {
  it("rejects cross-tenant body vs request slug", async () => {
    const { resolveWriteTenantId } = await import("./resolve-write-tenant");
    const request = new Request("http://localhost/api/locations", {
      headers: { "x-tenant-slug": "life-valley" },
    });
    const result = resolveWriteTenantId({
      request,
      bodyTenantId: "life-panoramica",
      actorTenantSlug: "life-valley",
    });
    assert.ok("error" in result);
  });

  it("accepts matching tenant body", async () => {
    const { resolveWriteTenantId } = await import("./resolve-write-tenant");
    const request = new Request("http://localhost/api/locations", {
      headers: { "x-tenant-slug": "life-valley" },
    });
    const result = resolveWriteTenantId({
      request,
      bodyTenantId: "life-valley",
      actorTenantSlug: "life-valley",
    });
    assert.ok("tenantId" in result);
    assert.equal(result.tenantId, "life-valley");
  });
});
