/**
 * White-label tenant factory tests.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isProductCapabilityEnabled } from "@life-community-os/types";
import { catalogSeedFor } from "@/lib/catalog/bootstrap-catalog";
import {
  LIFE_OCEAN_HILLS_TENANT_SLUG,
  LIFE_PANORAMICA_TENANT_SLUG,
  LIFE_VALLEY_TENANT_SLUG,
  listTerritoryUuidsForTenant,
  sanitizeTenantSlug,
} from "@/lib/tenant/ids";
import { resolveTenantContract } from "@/lib/tenant/admin-tenant";
import { requireTenantPack } from "@/lib/tenant/registry";

function catalogIds(slug: string, domain: "community" | "experiences" | "marketplace" | "resources"): string[] {
  return catalogSeedFor(slug, domain)
    .map((item) =>
      item && typeof item === "object" && "id" in item
        ? String((item as { id: unknown }).id)
        : "",
    )
    .filter(Boolean);
}

describe("TEST 1 — Panoramica loads only Panoramica", () => {
  it("keeps catalog and brand on the panoramica pack", () => {
    const pack = requireTenantPack(LIFE_PANORAMICA_TENANT_SLUG);
    assert.equal(pack.slug, "life-panoramica");
    assert.match(pack.theme.name, /Panoramica/i);
    const ids = catalogIds(LIFE_PANORAMICA_TENANT_SLUG, "experiences");
    assert.ok(ids.length > 0);
    assert.equal(ids.some((id) => id.startsWith("lv-") || id.startsWith("oh-")), false);
  });
});

describe("TEST 2 — Valley loads only Valley", () => {
  it("keeps valley seeds out of panoramica and ocean hills", () => {
    const pack = requireTenantPack(LIFE_VALLEY_TENANT_SLUG);
    assert.equal(pack.theme.name, "Life Valley");
    const ids = catalogIds(LIFE_VALLEY_TENANT_SLUG, "experiences");
    assert.ok(ids.every((id) => id.startsWith("lv-")));
    assert.equal(
      catalogIds(LIFE_PANORAMICA_TENANT_SLUG, "experiences").some((id) =>
        id.startsWith("lv-"),
      ),
      false,
    );
  });
});

describe("TEST 3 — Ocean Hills loads only Ocean Hills", () => {
  it("uses original coastal content and brand", () => {
    const pack = requireTenantPack(LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.equal(pack.theme.name, "Ocean Hills Community");
    assert.equal(pack.locale, "en");
    const ids = catalogIds(LIFE_OCEAN_HILLS_TENANT_SLUG, "experiences");
    assert.ok(ids.every((id) => id.startsWith("oh-")));
    assert.equal(ids.some((id) => id.includes("panoramica") || id.startsWith("lv-")), false);
    const locations = pack.getLocationSeeds();
    assert.ok(locations.every((place) => place.id.includes("ocean-hills")));
  });
});

describe("TEST 4 — changing tenant manually does not grant access", () => {
  it("rejects a tenant that is not in the manifest", () => {
    assert.equal(sanitizeTenantSlug("life-unknown"), null);
    assert.equal(sanitizeTenantSlug("life-ocean-hills"), "life-ocean-hills");
  });

  it("denies a Panoramica member reading Ocean Hills", async () => {
    const { resolveReadTenantId } = await import("./resolve-read-tenant");
    const { EMPTY_CURRENT_USER } = await import("@life-community-os/auth");
    const request = new Request(
      "http://localhost/api/locations?tenantId=life-ocean-hills",
      { headers: { "x-tenant-slug": "life-ocean-hills" } },
    );
    const result = resolveReadTenantId({
      request,
      queryTenantId: "life-ocean-hills",
      actor: {
        authenticated: true,
        hasMembership: true,
        providerReference: "auth-alex",
        personId: "person-alex",
        role: "member",
        tenantSlug: "life-panoramica",
        membershipId: "mem-p",
        permissions: [],
        tenantDenied: false,
        currentUser: {
          ...EMPTY_CURRENT_USER,
          authenticated: true,
          hasMembership: true,
          tenantId: "life-panoramica",
          personId: "person-alex",
          role: "member",
        },
      },
    });
    assert.ok("error" in result);
  });
});

describe("TEST 5 — disabled capability hides the module", () => {
  it("hides marketplace on Ocean Hills and golf on Valley", () => {
    const ocean = requireTenantPack(LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.equal(
      isProductCapabilityEnabled(ocean.productCapabilities, "marketplace"),
      false,
    );
    assert.equal(ocean.features.marketplace, false);
    const valley = requireTenantPack(LIFE_VALLEY_TENANT_SLUG);
    assert.equal(
      isProductCapabilityEnabled(valley.productCapabilities, "golf"),
      false,
    );
    const pano = requireTenantPack(LIFE_PANORAMICA_TENANT_SLUG);
    assert.equal(
      isProductCapabilityEnabled(pano.productCapabilities, "golf"),
      true,
    );
  });
});

describe("TEST 6 — branding does not leak across tenants", () => {
  it("keeps distinct names and primary colors", () => {
    const pano = requireTenantPack(LIFE_PANORAMICA_TENANT_SLUG);
    const valley = requireTenantPack(LIFE_VALLEY_TENANT_SLUG);
    const ocean = requireTenantPack(LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.notEqual(pano.theme.name, valley.theme.name);
    assert.notEqual(pano.theme.name, ocean.theme.name);
    assert.notEqual(valley.theme.name, ocean.theme.name);
    assert.notEqual(
      pano.theme.colors.brandPrimary,
      ocean.theme.colors.brandPrimary,
    );
    assert.notEqual(
      valley.theme.colors.brandPrimary,
      ocean.theme.colors.brandPrimary,
    );
  });

  it("exposes a stable TenantContract per slug", () => {
    const pano = resolveTenantContract(LIFE_PANORAMICA_TENANT_SLUG);
    const ocean = resolveTenantContract(LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.equal(pano.slug, "life-panoramica");
    assert.equal(ocean.locale, "en");
    assert.notEqual(pano.id, ocean.id);
    assert.notEqual(pano.territory.id, ocean.territory.id);
    assert.equal(pano.capabilities.golf, true);
    assert.equal(ocean.capabilities.golf, false);
    assert.equal(ocean.capabilities.marketplace, false);
  });
});

describe("Territory Core — Tenant 1:N", () => {
  it("lists distinct Territories per Tenant without Panorámica coupling", () => {
    const pano = listTerritoryUuidsForTenant(LIFE_PANORAMICA_TENANT_SLUG);
    const valley = listTerritoryUuidsForTenant(LIFE_VALLEY_TENANT_SLUG);
    const ocean = listTerritoryUuidsForTenant(LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.equal(pano.length, 1);
    assert.equal(valley.length, 1);
    assert.equal(ocean.length, 1);
    assert.notEqual(pano[0], valley[0]);
    assert.notEqual(pano[0], ocean[0]);
    assert.notEqual(valley[0], ocean[0]);
  });
});
