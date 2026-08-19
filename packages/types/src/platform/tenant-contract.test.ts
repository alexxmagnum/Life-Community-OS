import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isProductCapabilityEnabled,
  productCapabilitiesFromFeatures,
  resolveHostHintToSlug,
  type TenantIdentityRecord,
} from "./tenant-contract";

const records: TenantIdentityRecord[] = [
  {
    slug: "life-panoramica",
    name: "Panorámica Golf",
    tenantUuid: "10000000-0000-4000-8000-000000000001",
    territoryUuid: "10000000-0000-4000-8000-000000000002",
    hostHints: ["life-panoramica", "panoramica"],
    locale: "es",
    timezone: "Europe/Madrid",
  },
  {
    slug: "life-ocean-hills",
    name: "Ocean Hills Community",
    tenantUuid: "30000000-0000-4000-8000-000000000001",
    territoryUuid: "30000000-0000-4000-8000-000000000002",
    hostHints: ["life-ocean-hills", "oceanhills"],
    locale: "en",
    timezone: "Atlantic/Canary",
  },
];

describe("tenant contract", () => {
  it("maps host hints without per-tenant if trees", () => {
    assert.equal(
      resolveHostHintToSlug("oceanhills.local", records),
      "life-ocean-hills",
    );
    assert.equal(
      resolveHostHintToSlug("life-panoramica.example", records),
      "life-panoramica",
    );
  });

  it("derives product capabilities from features with overrides", () => {
    const map = productCapabilitiesFromFeatures(
      { marketplace: true, resources: true, experiences: true },
      { golf: false, marketplace: false },
    );
    assert.equal(isProductCapabilityEnabled(map, "marketplace"), false);
    assert.equal(isProductCapabilityEnabled(map, "reservations"), true);
    assert.equal(isProductCapabilityEnabled(map, "golf"), false);
  });
});
