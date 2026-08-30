/**
 * Platform capability extraction — tenant packs configure enablement only.
 * Run: pnpm --filter @life-community-os/web test:isolation
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  CAPABILITIES,
  capabilitiesForRole as platformCapabilitiesForRole,
  projectPlatformNavigation,
} from "@life-community-os/types";
import { capabilitiesForRole as valleyCapabilitiesForRole } from "@life-community-os/tenant-life-valley";
import { permissionsForRole } from "@/lib/auth/permissions";
import {
  LIFE_OCEAN_HILLS_TENANT_SLUG,
  LIFE_PANORAMICA_TENANT_SLUG,
  LIFE_VALLEY_TENANT_SLUG,
} from "@/lib/tenant/ids";
import { requireTenantPack } from "@/lib/tenant/registry";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../../");

describe("Phase 17B — platform capabilities", () => {
  it("keeps marketplace on for Panorámica and off for Ocean Hills", () => {
    const panoramica = permissionsForRole(
      "member",
      LIFE_PANORAMICA_TENANT_SLUG,
    );
    const ocean = permissionsForRole("member", LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.equal(panoramica.includes(CAPABILITIES.marketplaceCreate), true);
    assert.equal(ocean.includes(CAPABILITIES.marketplaceCreate), false);
    assert.equal(ocean.includes(CAPABILITIES.marketplaceView), false);
    assert.equal(ocean.includes(CAPABILITIES.housingView), false);
  });

  it("does not grant admin actions to a member", () => {
    const member = permissionsForRole("member", LIFE_PANORAMICA_TENANT_SLUG);
    assert.equal(member.includes(CAPABILITIES.manageEnter), false);
    assert.equal(member.includes(CAPABILITIES.securityView), false);
    const admin = permissionsForRole(
      "administrator",
      LIFE_PANORAMICA_TENANT_SLUG,
    );
    assert.equal(admin.includes(CAPABILITIES.manageEnter), true);
  });

  it("does not let a tenant pack grant permissions", () => {
    const pack = requireTenantPack(LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.equal(
      "capabilitiesForRole" in pack &&
        typeof (pack as { capabilitiesForRole?: unknown }).capabilitiesForRole ===
          "function",
      false,
    );
    const member = permissionsForRole("member", LIFE_OCEAN_HILLS_TENANT_SLUG);
    assert.equal(member.includes(CAPABILITIES.manageEnter), false);
    assert.equal(member.includes(CAPABILITIES.housingManage), false);
  });

  it("does not import Panorámica capability data from Valley", () => {
    assert.equal(valleyCapabilitiesForRole, platformCapabilitiesForRole);
    const valleyIndex = readFileSync(
      join(repoRoot, "tenants/life-valley/src/index.ts"),
      "utf8",
    );
    const valleyFeatures = readFileSync(
      join(repoRoot, "tenants/life-valley/src/features.ts"),
      "utf8",
    );
    const valleyPkg = JSON.parse(
      readFileSync(join(repoRoot, "tenants/life-valley/package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };
    assert.equal(valleyIndex.includes("tenant-life-panoramica"), false);
    assert.equal(valleyFeatures.includes("tenant-life-panoramica"), false);
    assert.equal(
      valleyPkg.dependencies?.["@life-community-os/tenant-life-panoramica"],
      undefined,
    );
    const valley = requireTenantPack(LIFE_VALLEY_TENANT_SLUG);
    assert.equal(valley.productCapabilities.golf, false);
    assert.equal(valley.features.securityModule, false);
  });

  it("hides Ocean Hills golf from the platform navigation contract", () => {
    const ocean = requireTenantPack(LIFE_OCEAN_HILLS_TENANT_SLUG);
    const projected = projectPlatformNavigation({
      configuration: ocean.resolveConfiguration(),
      hasCapability: () => true,
      isFeatureEnabled: (key) => Boolean(ocean.features[key]),
      isProductCapabilityEnabled: (key) =>
        ocean.productCapabilities[key] === true,
    });
    const labels = projected.flatMap((category) =>
      category.children.map((leaf) => leaf.label.toLowerCase()),
    );
    assert.equal(labels.some((label) => label.includes("golf")), false);
    assert.equal(
      projected.some((category) =>
        category.children.some((leaf) => leaf.href === "/marketplace"),
      ),
      false,
    );
  });
});
