/**
 * Critical multi-tenant isolation smoke tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LIFE_PANORAMICA_TENANT_SLUG,
  LIFE_VALLEY_TENANT_SLUG,
  resolveTenantPublicId,
  tenantSlugToTerritoryUuid,
  tenantSlugToUuid,
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
});
