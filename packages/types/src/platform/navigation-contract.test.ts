import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TenantConfiguration } from "./tenant-configuration";
import { CAPABILITIES } from "./capabilities";
import {
  navItemVisible,
  projectPlatformNavigation,
} from "./navigation-contract";

const baseConfiguration: TenantConfiguration = {
  tenantId: "tenant-x",
  branding: { name: "Example" },
  languages: ["es"],
  source: "tenant_pack",
  modules: {
    community: { enabled: true },
    experiences: { enabled: true },
    golf: { enabled: true },
    marketplace: { enabled: true },
    housing: { enabled: true },
    identity: { enabled: true },
  },
};

function leafLabels(golfOn: boolean, marketplaceOn: boolean): string[] {
  const projected = projectPlatformNavigation({
    configuration: baseConfiguration,
    hasCapability: () => true,
    isFeatureEnabled: () => true,
    isProductCapabilityEnabled: (key) => {
      if (key === "golf") return golfOn;
      if (key === "marketplace") return marketplaceOn;
      return true;
    },
  });
  return projected.flatMap((category) =>
    category.children.map((leaf) => leaf.label),
  );
}

describe("platform navigation contract", () => {
  it("hides golf when the product capability is off without knowing a tenant slug", () => {
    const withGolf = leafLabels(true, true);
    const withoutGolf = leafLabels(false, true);
    assert.equal(withGolf.includes("Golf"), true);
    assert.equal(withoutGolf.includes("Golf"), false);
  });

  it("hides marketplace when the product capability is off", () => {
    const on = leafLabels(false, true);
    const off = leafLabels(false, false);
    assert.equal(on.includes("Compra y venta"), true);
    assert.equal(off.includes("Compra y venta"), false);
  });

  it("separates UI visibility from authorization", () => {
    assert.equal(
      navItemVisible({
        featureEnabled: true,
        requiredCapability: CAPABILITIES.manageEnter,
        hasCapability: () => false,
      }),
      false,
    );
    assert.equal(
      navItemVisible({
        featureEnabled: false,
        hasCapability: () => true,
      }),
      false,
    );
    assert.equal(
      navItemVisible({
        featureEnabled: true,
        hasCapability: () => true,
      }),
      true,
    );
  });
});
