/**
 * Critical multi-tenant isolation smoke tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lifeValleyExperienceSeedIds } from "@/lib/catalog/bootstrap-catalog";
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
      assert.ok(
        id.startsWith("lv-"),
        `expected lv- prefix, got ${id}`,
      );
    }
  });
});
